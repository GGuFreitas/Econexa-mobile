import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { dbPool } from '@config/database.js';
import {
  criarProblemaNoBanco,
  criarUsuario,
  encerrarBanco,
  limparBanco,
} from '../../tests/integracao/fixtures.js';
import { criarServidor, tokenDe } from '../../tests/integracao/servidor.js';
import { invalidarCacheDeProblemas } from '@common/problemas/problemas.handler.js';
import {
  acoesDoUsuario,
  problemasApoiados,
  problemasRelatados,
  resumoDoUsuario,
} from './me.handler.js';

async function definirApoios(problemaId: number, total: number): Promise<void> {
  await dbPool.query('UPDATE problemas SET cont_apoios = $2 WHERE id = $1', [problemaId, total]);
}

async function apoiar(problemaId: number, usuarioId: number): Promise<void> {
  await dbPool.query('INSERT INTO problema_apoios (problema_id, usuario_id) VALUES ($1, $2)', [
    problemaId,
    usuarioId,
  ]);
}

async function criarMobilizacao(
  problemaId: number,
  usuarioId: number,
  diasAFrente: number,
  status = 'agendada',
  titulo = 'Mutirão',
): Promise<number> {
  const result = await dbPool.query(
    `INSERT INTO mobilizacoes (problema_id, usuario_id, titulo, data_inicio, status)
     VALUES ($1, $2, $3, now() + make_interval(days => $4), $5)
     RETURNING id`,
    [problemaId, usuarioId, titulo, diasAFrente, status],
  );
  return Number(result.rows[0].id);
}

async function participar(mobilizacaoId: number, usuarioId: number): Promise<void> {
  await dbPool.query(
    'INSERT INTO mobilizacao_participantes (mobilizacao_id, usuario_id) VALUES ($1, $2)',
    [mobilizacaoId, usuarioId],
  );
}

async function encaminhar(
  problemaId: number,
  usuarioId: number,
  diasAtras: number,
  status = 'enviado',
): Promise<number> {
  const orgao = await dbPool.query('SELECT id FROM orgaos ORDER BY id LIMIT 1');
  const result = await dbPool.query(
    `INSERT INTO problema_encaminhamentos
       (problema_id, orgao_id, usuario_id, referencia, assunto, mensagem, status, enviado_em)
     VALUES ($1, $2, $3, 'REF-1', 'Assunto', 'Mensagem', $4, now() - make_interval(days => $5))
     RETURNING id`,
    [problemaId, orgao.rows[0].id, usuarioId, status, diasAtras],
  );
  return Number(result.rows[0].id);
}

describe('me: resumo, listas e avisos de quem está logado', () => {
  let app: FastifyInstance;
  let eu: number;
  let outra: number;

  beforeAll(async () => {
    app = await criarServidor();
  });

  beforeEach(async () => {
    await limparBanco();
    await invalidarCacheDeProblemas();
    eu = await criarUsuario('Joana Perfil');
    outra = await criarUsuario('Rita Vizinha');
  });

  afterAll(async () => {
    await app.close();
    await encerrarBanco();
  });

  it('conta relatados, apoios dados, apoios recebidos e ações só da própria pessoa', async () => {
    const meu = await criarProblemaNoBanco({ usuarioId: eu, titulo: 'Meu' });
    const resolvido = await criarProblemaNoBanco({ usuarioId: eu, status: 'resolvido' });
    await criarProblemaNoBanco({ usuarioId: eu, status: 'removido' });
    const dela = await criarProblemaNoBanco({ usuarioId: outra });
    await definirApoios(meu, 12);
    await definirApoios(resolvido, 5);
    await apoiar(dela, eu);
    await apoiar(meu, outra);
    await criarMobilizacao(meu, eu, 3);
    const daOutra = await criarMobilizacao(dela, outra, 3);
    await participar(daOutra, eu);
    await criarMobilizacao(meu, eu, 3, 'cancelada');
    await criarMobilizacao(dela, outra, 3);

    const resumo = await resumoDoUsuario(eu);

    expect(resumo).toMatchObject({
      relatados: 2,
      apoios_recebidos: 17,
      apoios_dados: 1,
      acoes: 2,
    });
  });

  it('diz desde quando a pessoa está no Mutira', async () => {
    await dbPool.query(`UPDATE users SET criado_em = '2026-10-03T12:00:00Z' WHERE id = $1`, [eu]);

    const resumo = await resumoDoUsuario(eu);

    expect(resumo.membro_desde.toISOString()).toBe('2026-10-03T12:00:00.000Z');
  });

  it('avisa do relato perto da meta, mas não do que está longe, já bateu ou foi resolvido', async () => {
    const perto = await criarProblemaNoBanco({ usuarioId: eu, titulo: 'Perto' });
    const longe = await criarProblemaNoBanco({ usuarioId: eu, titulo: 'Longe' });
    const bateu = await criarProblemaNoBanco({ usuarioId: eu, titulo: 'Bateu' });
    const resolvido = await criarProblemaNoBanco({
      usuarioId: eu,
      titulo: 'Resolvido',
      status: 'resolvido',
    });
    await definirApoios(perto, 41);
    await definirApoios(longe, 10);
    await definirApoios(bateu, 50);
    await definirApoios(resolvido, 45);

    const { avisos } = await resumoDoUsuario(eu);

    expect(avisos).toEqual([
      { tipo: 'perto_da_meta', problema_id: perto, titulo: 'Perto', cont_apoios: 41, meta: 50 },
    ]);
  });

  it('avisa do encaminhamento enviado há uma semana ou mais sem resposta', async () => {
    const antigo = await criarProblemaNoBanco({ usuarioId: eu, titulo: 'Antigo' });
    const recente = await criarProblemaNoBanco({ usuarioId: eu, titulo: 'Recente' });
    const respondido = await criarProblemaNoBanco({ usuarioId: eu, titulo: 'Respondido' });
    const deOutra = await criarProblemaNoBanco({ usuarioId: outra, titulo: 'De outra' });
    const encaminhamento = await encaminhar(antigo, eu, 10);
    await encaminhar(recente, eu, 2);
    await encaminhar(respondido, eu, 10, 'respondido');
    await encaminhar(deOutra, outra, 10);

    const { avisos } = await resumoDoUsuario(eu);

    expect(avisos).toHaveLength(1);
    expect(avisos[0]).toMatchObject({
      tipo: 'sem_resposta',
      problema_id: antigo,
      encaminhamento_id: encaminhamento,
      titulo: 'Antigo',
      dias: 10,
    });
  });

  it('avisa da ação agendada para os próximos dias, com o papel da pessoa', async () => {
    const meu = await criarProblemaNoBanco({ usuarioId: eu });
    const dela = await criarProblemaNoBanco({ usuarioId: outra });
    const organizo = await criarMobilizacao(meu, eu, 2, 'agendada', 'Organizo');
    const participo = await criarMobilizacao(dela, outra, 4, 'agendada', 'Participo');
    await participar(participo, eu);
    await participar(participo, outra);
    await criarMobilizacao(meu, eu, 12, 'agendada', 'Longe demais');
    await criarMobilizacao(meu, eu, -1, 'agendada', 'Já passou');
    await criarMobilizacao(meu, eu, 2, 'cancelada', 'Cancelada');
    await criarMobilizacao(dela, outra, 2, 'agendada', 'Não é minha');

    const { avisos } = await resumoDoUsuario(eu);

    expect(avisos.map((aviso) => aviso.tipo === 'acao_proxima' && aviso.titulo)).toEqual([
      'Organizo',
      'Participo',
    ]);
    expect(avisos[0]).toMatchObject({ mobilizacao_id: organizo, papel: 'organizadora' });
    expect(avisos[1]).toMatchObject({
      mobilizacao_id: participo,
      papel: 'participante',
      cont_participantes: 2,
    });
  });

  it('lista os relatados da pessoa, do mais novo ao mais antigo, com a capa', async () => {
    const primeiro = await criarProblemaNoBanco({ usuarioId: eu, titulo: 'Primeiro' });
    await criarProblemaNoBanco({ usuarioId: eu, titulo: 'Resolvido', status: 'resolvido' });
    await criarProblemaNoBanco({ usuarioId: eu, titulo: 'Removido', status: 'removido' });
    await criarProblemaNoBanco({ usuarioId: outra, titulo: 'Dela' });
    await dbPool.query(
      `INSERT INTO imagens (tipo_entidade, entidade_id, url, principal, ordem)
       VALUES ('problema', $1, 'http://minio/capa.jpg', true, 0)`,
      [primeiro],
    );

    const lista = await problemasRelatados(eu, {});

    expect(lista.map((p) => p.titulo)).toEqual(['Resolvido', 'Primeiro']);
    expect(lista[1].capa_url).toBe('http://minio/capa.jpg');
  });

  it('lista só os problemas que a pessoa apoiou', async () => {
    const apoiado = await criarProblemaNoBanco({ usuarioId: outra, titulo: 'Apoiado' });
    await criarProblemaNoBanco({ usuarioId: outra, titulo: 'Não apoiado' });
    await apoiar(apoiado, eu);

    const lista = await problemasApoiados(eu, {});

    expect(lista.map((p) => p.titulo)).toEqual(['Apoiado']);
  });

  it('GET /me/apoios devolve os ids que a pessoa apoia, sem os removidos', async () => {
    const primeiro = await criarProblemaNoBanco({ usuarioId: outra, titulo: 'Primeiro' });
    const segundo = await criarProblemaNoBanco({ usuarioId: outra, titulo: 'Segundo' });
    const removido = await criarProblemaNoBanco({ usuarioId: outra, status: 'removido' });
    await criarProblemaNoBanco({ usuarioId: outra, titulo: 'Não apoiado' });
    await apoiar(segundo, eu);
    await apoiar(primeiro, eu);
    await apoiar(removido, eu);
    await apoiar(primeiro, outra);

    const resposta = await app.inject({
      method: 'GET',
      url: '/api/me/apoios',
      headers: { authorization: `Bearer ${tokenDe(eu)}` },
    });

    expect(resposta.json()).toEqual([primeiro, segundo]);
  });

  it('lista as ações com o papel da pessoa e o título do problema', async () => {
    const meu = await criarProblemaNoBanco({ usuarioId: eu, titulo: 'Poste apagado' });
    const dela = await criarProblemaNoBanco({ usuarioId: outra, titulo: 'Calçada' });
    await criarMobilizacao(meu, eu, -10, 'realizada', 'Abaixo-assinado');
    const participo = await criarMobilizacao(dela, outra, 2, 'agendada', 'Mutirão');
    await participar(participo, eu);
    await criarMobilizacao(dela, outra, 2, 'agendada', 'Não é minha');

    const acoes = await acoesDoUsuario(eu, {});

    expect(acoes).toEqual([
      expect.objectContaining({
        titulo: 'Mutirão',
        papel: 'participante',
        problema_titulo: 'Calçada',
      }),
      expect.objectContaining({
        titulo: 'Abaixo-assinado',
        papel: 'organizadora',
        status: 'realizada',
        problema_titulo: 'Poste apagado',
      }),
    ]);
  });

  it('as rotas /me exigem login e respondem pela pessoa do token', async () => {
    await criarProblemaNoBanco({ usuarioId: eu, titulo: 'Meu' });

    const semToken = await app.inject({ method: 'GET', url: '/api/me/resumo' });
    const resumo = await app.inject({
      method: 'GET',
      url: '/api/me/resumo',
      headers: { authorization: `Bearer ${tokenDe(eu)}` },
    });
    const relatados = await app.inject({
      method: 'GET',
      url: '/api/me/relatados',
      headers: { authorization: `Bearer ${tokenDe(eu)}` },
    });

    expect(semToken.statusCode).toBe(401);
    expect(resumo.json()).toMatchObject({ relatados: 1, avisos: [] });
    expect(relatados.json().map((p: { titulo: string }) => p.titulo)).toEqual(['Meu']);
  });

  it('a listagem pública ignora os filtros por pessoa, que só existem em /me', async () => {
    const apoiado = await criarProblemaNoBanco({ usuarioId: outra, titulo: 'Apoiado' });
    await criarProblemaNoBanco({ usuarioId: outra, titulo: 'Outro' });
    await apoiar(apoiado, eu);

    const resposta = await app.inject({
      method: 'GET',
      url: `/api/problemas?apoiadoPor=${eu}&relatadoPor=${eu}`,
    });

    expect(resposta.json()).toHaveLength(2);
  });
});
