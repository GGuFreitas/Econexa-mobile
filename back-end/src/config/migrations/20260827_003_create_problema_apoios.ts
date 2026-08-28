import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('problema_apoios', (table) => {
    table.integer('problema_id').notNullable().references('id').inTable('problemas').onDelete('CASCADE');
    table.integer('usuario_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.specificType('peso_aplicado', 'numeric').notNullable().defaultTo(1);
    table.timestamp('criado_em').defaultTo(knex.fn.now());
    table.primary(['problema_id', 'usuario_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('problema_apoios');
}
