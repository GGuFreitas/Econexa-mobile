import type { Knex } from 'knex';

const TIPOS_ANTERIORES = [
  'PROBLEMA_CRIADO',
  'EVIDENCIA_ADICIONADA',
  'COMENTARIO_CRIADO',
  'MOBILIZACAO_CRIADA',
  'MOBILIZACAO_REALIZADA',
  'ENCAMINHADO',
  'RESPOSTA_RECEBIDA',
  'STATUS_ALTERADO',
  'RESOLVIDO',
];

const TIPOS_NOVOS = [...TIPOS_ANTERIORES, 'APOIO_CRIADO', 'APOIO_REMOVIDO'];

function checkDeTipos(tipos: string[]): string {
  return `ALTER TABLE problema_eventos
          ADD CONSTRAINT chk_problema_eventos_tipo
          CHECK (tipo IN (${tipos.map((tipo) => `'${tipo}'`).join(', ')}))`;
}

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    'ALTER TABLE problema_eventos DROP CONSTRAINT IF EXISTS chk_problema_eventos_tipo',
  );
  await knex.raw(checkDeTipos(TIPOS_NOVOS));

  await knex.raw(`
    INSERT INTO problema_eventos (problema_id, tipo, usuario_id, dados, criado_em)
    SELECT a.problema_id, 'APOIO_CRIADO', a.usuario_id, '{}'::jsonb, a.criado_em
    FROM problema_apoios a
    WHERE NOT EXISTS (
      SELECT 1 FROM problema_eventos e
      WHERE e.problema_id = a.problema_id
        AND e.usuario_id = a.usuario_id
        AND e.tipo = 'APOIO_CRIADO'
    )
  `);

  await knex.raw(`
    UPDATE problemas p
    SET cont_apoios = c.total,
        cont_apoios_ponderados = c.peso
    FROM (
      SELECT pr.id,
             COUNT(a.usuario_id)::int AS total,
             COALESCE(SUM(a.peso_aplicado), 0)::numeric AS peso
      FROM problemas pr
      LEFT JOIN problema_apoios a ON a.problema_id = pr.id
      GROUP BY pr.id
    ) c
    WHERE p.id = c.id
      AND (
        p.cont_apoios IS DISTINCT FROM c.total
        OR p.cont_apoios_ponderados IS DISTINCT FROM c.peso
      )
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    `DELETE FROM problema_eventos WHERE tipo IN ('APOIO_CRIADO', 'APOIO_REMOVIDO')`,
  );
  await knex.raw(
    'ALTER TABLE problema_eventos DROP CONSTRAINT IF EXISTS chk_problema_eventos_tipo',
  );
  await knex.raw(checkDeTipos(TIPOS_ANTERIORES));
}
