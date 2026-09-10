import type { Knex } from 'knex';

const TIPOS = [
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

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('problema_eventos', (table) => {
    table.increments('id').primary();
    table
      .integer('problema_id')
      .notNullable()
      .references('id')
      .inTable('problemas')
      .onDelete('CASCADE');
    table.string('tipo', 40).notNullable();
    table.integer('usuario_id').references('id').inTable('users').onDelete('SET NULL');
    table.jsonb('dados').notNullable().defaultTo('{}');
    table.timestamp('criado_em').defaultTo(knex.fn.now());
  });

  await knex.schema.raw(
    'CREATE INDEX idx_problema_eventos_problema ON problema_eventos (problema_id, criado_em DESC, id DESC)',
  );

  await knex.schema.raw(
    `ALTER TABLE problema_eventos
     ADD CONSTRAINT chk_problema_eventos_tipo
     CHECK (tipo IN (${TIPOS.map((tipo) => `'${tipo}'`).join(', ')}))`,
  );

  await knex.raw(`
    INSERT INTO problema_eventos (problema_id, tipo, usuario_id, dados, criado_em)
    SELECT p.id, 'PROBLEMA_CRIADO', p.usuario_id, jsonb_build_object('titulo', p.titulo), p.criado_em
    FROM problemas p
  `);

  await knex.raw(`
    INSERT INTO problema_eventos (problema_id, tipo, usuario_id, dados, criado_em)
    SELECT i.entidade_id, 'EVIDENCIA_ADICIONADA', NULL,
           jsonb_build_object('imagem_id', i.id, 'url', i.url), i.criado_em
    FROM imagens i
    INNER JOIN problemas p ON p.id = i.entidade_id
    WHERE i.tipo_entidade = 'problema'
  `);

  await knex.raw(`
    INSERT INTO problema_eventos (problema_id, tipo, usuario_id, dados, criado_em)
    SELECT c.problema_id, 'COMENTARIO_CRIADO', c.usuario_id,
           jsonb_build_object('comentario_id', c.id, 'trecho', left(c.conteudo, 140)), c.criado_em
    FROM problema_comentarios c
  `);

  await knex.raw(`
    INSERT INTO problema_eventos (problema_id, tipo, usuario_id, dados, criado_em)
    SELECT m.problema_id, 'MOBILIZACAO_CRIADA', m.usuario_id,
           jsonb_build_object('mobilizacao_id', m.id, 'titulo', m.titulo), m.criado_em
    FROM mobilizacoes m
  `);

  await knex.raw(`
    INSERT INTO problema_eventos (problema_id, tipo, usuario_id, dados, criado_em)
    SELECT m.problema_id, 'MOBILIZACAO_REALIZADA', m.usuario_id,
           jsonb_build_object('mobilizacao_id', m.id, 'titulo', m.titulo), m.atualizado_em
    FROM mobilizacoes m
    WHERE m.status = 'realizada'
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('problema_eventos');
}
