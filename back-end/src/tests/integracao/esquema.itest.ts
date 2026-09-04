import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { dbPool } from '@config/database.js';
import { findNearbyProblema, listarProblemas } from '@common/problemas/problemas.sql.js';
import { criarUsuario, encerrarBanco, limparBanco, SAO_PAULO } from './fixtures.js';

const PROBLEMAS_SEMEADOS = 4000;
const RAIO_ESTREITO_METROS = 150;

const TIPOS_ACEITOS = [
  'PROBLEMA_CRIADO',
  'EVIDENCIA_ADICIONADA',
  'COMENTARIO_CRIADO',
  'APOIO_CRIADO',
  'APOIO_REMOVIDO',
  'MOBILIZACAO_CRIADA',
  'MOBILIZACAO_REALIZADA',
  'ENCAMINHADO',
  'RESPOSTA_RECEBIDA',
  'STATUS_ALTERADO',
  'RESOLVIDO',
];

type Consulta = (texto: string, valores?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;

const consultar = dbPool.query.bind(dbPool) as unknown as Consulta;

async function planoDe(executar: () => Promise<unknown>): Promise<string> {
  const espia = vi.spyOn(dbPool, 'query');
  await executar();
  const ultima = espia.mock.calls.at(-1) as unknown as [string, unknown[]];
  espia.mockRestore();

  const explicado = await consultar(`EXPLAIN ${ultima[0]}`, ultima[1]);
  return explicado.rows.map((linha) => String(linha['QUERY PLAN'])).join('\n');
}

describe('garantias que o esquema dá por si', () => {
  let autor: number;
  let problemaId: number;

  beforeAll(async () => {
    await limparBanco();
    autor = await criarUsuario('Marta Esquema');

    const criado = await consultar(
      `INSERT INTO problemas (usuario_id, titulo, causa_id, tipo, status, geom, escopo)
       VALUES ($1, 'Âncora', 1, 'problema', 'ativo',
               ST_SetSRID(ST_MakePoint($2, $3), 4326), 'local')
       RETURNING id`,
      [autor, SAO_PAULO.lng, SAO_PAULO.lat],
    );
    problemaId = Number(criado.rows[0].id);

    await consultar(
      `INSERT INTO problemas (usuario_id, titulo, causa_id, tipo, status, geom, escopo)
       SELECT $1, 'Ruído ' || serie, 1, 'problema', 'ativo',
              ST_SetSRID(
                ST_MakePoint($2 + (serie % 200) * 0.002, $3 + (serie / 200) * 0.002),
                4326
              ),
              'local'
       FROM generate_series(1, $4) AS serie`,
      [autor, SAO_PAULO.lng, SAO_PAULO.lat, PROBLEMAS_SEMEADOS],
    );

    await consultar('ANALYZE problemas');
  });

  afterAll(encerrarBanco);

  it('o CHECK de problema_eventos.tipo aceita os onze tipos emitidos', async () => {
    for (const tipo of TIPOS_ACEITOS) {
      await expect(
        consultar('INSERT INTO problema_eventos (problema_id, tipo) VALUES ($1, $2)', [
          problemaId,
          tipo,
        ]),
      ).resolves.toBeDefined();
    }
  });

  it('o CHECK de problema_eventos.tipo recusa tipo fora da lista', async () => {
    await expect(
      consultar('INSERT INTO problema_eventos (problema_id, tipo) VALUES ($1, $2)', [
        problemaId,
        'FULANO_FEZ_ALGO',
      ]),
    ).rejects.toMatchObject({ code: '23514' });

    await expect(
      consultar('INSERT INTO problema_eventos (problema_id, tipo) VALUES ($1, $2)', [
        problemaId,
        'problema_criado',
      ]),
    ).rejects.toMatchObject({ code: '23514' });
  });

  it('a listagem por raio usa o índice de geografia, não uma varredura da tabela', async () => {
    const plano = await planoDe(() =>
      listarProblemas({
        lat: SAO_PAULO.lat,
        lng: SAO_PAULO.lng,
        raio: RAIO_ESTREITO_METROS,
      }),
    );

    expect(plano).toContain('idx_problemas_geom_geog');
    expect(plano).not.toContain('Seq Scan on problemas');
  });

  it('o dedupe usa o índice de geografia', async () => {
    const plano = await planoDe(() =>
      findNearbyProblema(SAO_PAULO.lat, SAO_PAULO.lng, 30, 1, 'problema'),
    );

    expect(plano).toContain('idx_problemas_geom_geog');
    expect(plano).not.toContain('Seq Scan on problemas');
  });
});
