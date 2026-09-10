import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('orgaos', (table) => {
    table.increments('id').primary();
    table.string('nome', 160).notNullable();
    table.string('email', 160).notNullable();
    table.string('esfera', 20).notNullable().defaultTo('municipal');
    table.string('tipo', 40).notNullable().defaultTo('outro');
    table.boolean('ativo').notNullable().defaultTo(true);
    table.timestamp('criado_em').defaultTo(knex.fn.now());
  });

  await knex.raw(`
    INSERT INTO orgaos (nome, email, esfera, tipo) VALUES
    ('[EXEMPLO] Prefeitura Municipal', 'prefeitura@exemplo.invalid', 'municipal', 'prefeitura'),
    ('[EXEMPLO] Secretaria de Obras e Mobilidade', 'obras@exemplo.invalid', 'municipal', 'secretaria'),
    ('[EXEMPLO] Secretaria de Meio Ambiente', 'meioambiente@exemplo.invalid', 'municipal', 'secretaria'),
    ('[EXEMPLO] Ouvidoria Estadual', 'ouvidoria@exemplo.invalid', 'estadual', 'ouvidoria'),
    ('[EXEMPLO] Órgão Ambiental Federal', 'ambiental@exemplo.invalid', 'federal', 'orgao_ambiental')
  `);

  await knex.schema.createTable('problema_encaminhamentos', (table) => {
    table.increments('id').primary();
    table
      .integer('problema_id')
      .notNullable()
      .references('id')
      .inTable('problemas')
      .onDelete('CASCADE');
    table.integer('orgao_id').notNullable().references('id').inTable('orgaos');
    table
      .integer('usuario_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('referencia', 40).notNullable();
    table.string('assunto', 200).notNullable();
    table.text('mensagem').notNullable();
    table.string('status', 20).notNullable().defaultTo('pendente');
    table.timestamp('enviado_em');
    table.string('protocolo', 60);
    table.text('resposta');
    table.timestamp('respondido_em');
    table.timestamp('criado_em').defaultTo(knex.fn.now());
    table.timestamp('atualizado_em').defaultTo(knex.fn.now());
  });

  await knex.schema.raw(
    'CREATE INDEX idx_encaminhamentos_problema ON problema_encaminhamentos (problema_id, criado_em DESC)',
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('problema_encaminhamentos');
  await knex.schema.dropTableIfExists('orgaos');
}
