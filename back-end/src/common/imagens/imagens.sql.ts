import { dbPool } from '@config/database.js';

export async function insertImagem(input: {
  tipo_entidade: string;
  entidade_id: number;
  url: string;
  principal: boolean;
  ordem: number;
}) {
  const result = await dbPool.query(
    `INSERT INTO imagens (tipo_entidade, entidade_id, url, principal, ordem)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.tipo_entidade, input.entidade_id, input.url, input.principal, input.ordem],
  );
  return result.rows[0];
}

export async function listImagensByEntity(tipoEntidade: string, entidadeId: number) {
  const result = await dbPool.query(
    `SELECT * FROM imagens
     WHERE tipo_entidade = $1 AND entidade_id = $2
     ORDER BY principal DESC, ordem ASC, criado_em ASC`,
    [tipoEntidade, entidadeId],
  );
  return result.rows;
}
