import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('problema_encaminhamentos', (table) => {
    table.text('falha_motivo');
  });

  await knex.raw(`
    UPDATE problema_encaminhamentos e
    SET status = 'falhou',
        falha_motivo = 'Encerrado na migração de unicidade: já havia outro encaminhamento aberto para o mesmo órgão.',
        atualizado_em = now()
    WHERE e.status IN ('pendente', 'enviado')
      AND EXISTS (
        SELECT 1 FROM problema_encaminhamentos anterior
        WHERE anterior.problema_id = e.problema_id
          AND anterior.orgao_id = e.orgao_id
          AND anterior.status IN ('pendente', 'enviado')
          AND anterior.id < e.id
      )
  `);

  await knex.raw(`
    CREATE UNIQUE INDEX uq_encaminhamento_aberto
    ON problema_encaminhamentos (problema_id, orgao_id)
    WHERE status IN ('pendente', 'enviado')
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS uq_encaminhamento_aberto');
  await knex.schema.alterTable('problema_encaminhamentos', (table) => {
    table.dropColumn('falha_motivo');
  });
}
