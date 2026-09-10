import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Knex } from 'knex';
import { conexaoDeMigracao, recriarBanco, removerBanco } from './banco.js';

const BANCO = 'econexa_migracoes_itest';
const ULTIMA_MIGRACAO_ANTIGA = '20260903_009_create_encaminhamentos.ts';

let knex: Knex;

async function migrarAte(nome: string): Promise<void> {
  for (;;) {
    const [, aplicadas] = (await knex.migrate.up()) as [number, string[]];
    if (aplicadas.length === 0) {
      throw new Error(`A migração ${nome} não foi encontrada.`);
    }
    if (aplicadas.some((arquivo) => arquivo.endsWith(nome))) return;
  }
}

async function semearSujeira(): Promise<{ problemaId: number }> {
  const [ana] = await knex('users')
    .insert({ nome: 'Ana', email: 'ana@exemplo.invalid', senha: 'x', role: 'citizen', peso_voto: 1 })
    .returning('id');
  const [bruno] = await knex('users')
    .insert({ nome: 'Bruno', email: 'bruno@exemplo.invalid', senha: 'x', role: 'citizen', peso_voto: 3 })
    .returning('id');

  const problema = await knex.raw(
    `INSERT INTO problemas (usuario_id, titulo, causa_id, tipo, status, geom, escopo, cont_apoios, cont_apoios_ponderados)
     VALUES (?, 'Alagamento sujo', 1, 'problema', 'ativo',
             ST_SetSRID(ST_MakePoint(-46.6333, -23.5505), 4326), 'local', 0, 0)
     RETURNING id`,
    [ana.id],
  );
  const problemaId = Number(problema.rows[0].id);

  await knex.raw(
    `INSERT INTO problema_apoios (problema_id, usuario_id, peso_aplicado, criado_em) VALUES
       (?, ?, 1, now() - interval '2 days'),
       (?, ?, 3, now() - interval '1 day')`,
    [problemaId, ana.id, problemaId, bruno.id],
  );

  await knex.raw(
    `INSERT INTO problema_denuncias (problema_id, usuario_id, motivo, criado_em) VALUES
       (?, ?, 'spam', now() - interval '3 hours'),
       (?, ?, 'duplicado', now() - interval '2 hours'),
       (?, ?, 'outro', now() - interval '1 hour')`,
    [problemaId, bruno.id, problemaId, bruno.id, problemaId, bruno.id],
  );

  await knex.raw(
    `INSERT INTO problema_encaminhamentos
       (problema_id, orgao_id, usuario_id, referencia, assunto, mensagem, status, enviado_em) VALUES
       (?, 1, ?, 'MUTIRA-SUJO1', 'assunto 1', 'corpo 1', 'enviado', now() - interval '5 hours'),
       (?, 1, ?, 'MUTIRA-SUJO2', 'assunto 2', 'corpo 2', 'pendente', NULL)`,
    [problemaId, ana.id, problemaId, ana.id],
  );

  return { problemaId };
}

describe('migrações do M9.5 sobre dados sujos', () => {
  let problemaId: number;

  beforeAll(async () => {
    const connection = await recriarBanco(BANCO);
    knex = conexaoDeMigracao(connection);
    await migrarAte(ULTIMA_MIGRACAO_ANTIGA);
    ({ problemaId } = await semearSujeira());
    await knex.migrate.latest();
  });

  afterAll(async () => {
    await knex.destroy();
    await removerBanco(BANCO);
  });

  it('deduplica as denúncias preservando a mais antiga do par', async () => {
    const denuncias = await knex('problema_denuncias').select('motivo');

    expect(denuncias).toHaveLength(1);
    expect(denuncias[0].motivo).toBe('spam');
  });

  it('cria a unicidade de denúncia por usuário depois de limpar o legado', async () => {
    const usuario = await knex('problema_denuncias').first('usuario_id');

    await expect(
      knex('problema_denuncias').insert({
        problema_id: problemaId,
        usuario_id: usuario.usuario_id,
        motivo: 'outro',
      }),
    ).rejects.toMatchObject({ code: '23505' });
  });

  it('reconcilia os contadores de apoio com as linhas de problema_apoios', async () => {
    const problema = await knex('problemas')
      .where({ id: problemaId })
      .first('cont_apoios', 'cont_apoios_ponderados');

    expect(Number(problema.cont_apoios)).toBe(2);
    expect(Number(problema.cont_apoios_ponderados)).toBe(4);
  });

  it('faz o backfill possível de APOIO_CRIADO a partir de problema_apoios', async () => {
    const eventos = await knex('problema_eventos')
      .where({ problema_id: problemaId, tipo: 'APOIO_CRIADO' })
      .select('usuario_id');

    expect(eventos).toHaveLength(2);
  });

  it('aceita os tipos novos no CHECK e continua recusando tipo desconhecido', async () => {
    await expect(
      knex('problema_eventos').insert({ problema_id: problemaId, tipo: 'APOIO_REMOVIDO' }),
    ).resolves.toBeDefined();

    await expect(
      knex('problema_eventos').insert({ problema_id: problemaId, tipo: 'TIPO_INVENTADO' }),
    ).rejects.toMatchObject({ code: '23514' });
  });

  it('encerra o encaminhamento duplicado e guarda o motivo antes de criar o índice único', async () => {
    const encaminhamentos = await knex('problema_encaminhamentos')
      .orderBy('id')
      .select('status', 'falha_motivo');

    expect(encaminhamentos.map((linha) => linha.status)).toEqual(['enviado', 'falhou']);
    expect(encaminhamentos[1].falha_motivo).toContain('unicidade');
  });

  it('troca os índices GIST de geometria pelos de geografia', async () => {
    const indices = await knex('pg_indexes').where({ tablename: 'problemas' }).pluck('indexname');

    expect(indices).toContain('idx_problemas_geom_geog');
    expect(indices).not.toContain('idx_problemas_geom');
  });

  it('derruba as tabelas do domínio eventos e o índice morto de mobilizações', async () => {
    const tabelas = await knex('information_schema.tables')
      .where({ table_schema: 'public' })
      .whereIn('table_name', ['eventos', 'evento_problema', 'evento_participantes'])
      .pluck('table_name');
    expect(tabelas).toHaveLength(0);

    const indices = await knex('pg_indexes')
      .where({ tablename: 'mobilizacoes' })
      .pluck('indexname');
    expect(indices).not.toContain('idx_mobilizacoes_geom');
  });

  it('derruba a coluna de visualizações e o índice de denúncia que virou redundante', async () => {
    const colunas = await knex('information_schema.columns')
      .where({ table_name: 'problemas' })
      .pluck('column_name');
    expect(colunas).not.toContain('cont_visualizacoes');
    expect(colunas).toContain('cont_apoios_ponderados');

    const indices = await knex('pg_indexes')
      .where({ tablename: 'problema_denuncias' })
      .pluck('indexname');
    expect(indices).not.toContain('idx_denuncias_problema');
    expect(indices).toContain('uq_denuncias_problema_usuario');
  });

  it('o ciclo rollback e migrate volta ao mesmo estado', async () => {
    await knex.migrate.rollback();

    const semGeografia = await knex('pg_indexes')
      .where({ tablename: 'problemas' })
      .pluck('indexname');
    expect(semGeografia).toContain('idx_problemas_geom');
    expect(semGeografia).not.toContain('idx_problemas_geom_geog');

    const eventosDeVolta = await knex('information_schema.tables')
      .where({ table_schema: 'public' })
      .whereIn('table_name', ['eventos', 'evento_problema', 'evento_participantes'])
      .pluck('table_name');
    expect(eventosDeVolta).toHaveLength(3);

    const colunasDeVolta = await knex('information_schema.columns')
      .where({ table_name: 'problemas' })
      .pluck('column_name');
    expect(colunasDeVolta).toContain('cont_visualizacoes');

    const colunas = await knex('information_schema.columns')
      .where({ table_name: 'problema_encaminhamentos', column_name: 'falha_motivo' })
      .pluck('column_name');
    expect(colunas).toHaveLength(0);

    await knex.migrate.latest();

    const comGeografia = await knex('pg_indexes')
      .where({ tablename: 'problemas' })
      .pluck('indexname');
    expect(comGeografia).toContain('idx_problemas_geom_geog');

    const eventosFora = await knex('information_schema.tables')
      .where({ table_schema: 'public' })
      .whereIn('table_name', ['eventos', 'evento_problema', 'evento_participantes'])
      .pluck('table_name');
    expect(eventosFora).toHaveLength(0);

    const denuncias = await knex('problema_denuncias').select('motivo');
    expect(denuncias).toHaveLength(1);
  });
});
