import { dbPool } from '@config/database.js';
import type { Executor } from '@shared/transacao.js';
import type { Imagem } from './imagens.types.js';

export async function insertImagem(
  input: {
    tipo_entidade: string;
    entidade_id: number;
    url: string;
    principal: boolean;
    ordem: number;
  },
  executor: Executor = dbPool,
): Promise<Imagem> {
  const result = await executor.query(
    `INSERT INTO imagens (tipo_entidade, entidade_id, url, principal, ordem)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.tipo_entidade, input.entidade_id, input.url, input.principal, input.ordem],
  );
  return result.rows[0];
}

export async function listImagensByEntity(
  tipoEntidade: string,
  entidadeId: number,
): Promise<Imagem[]> {
  const result = await dbPool.query(
    `SELECT * FROM imagens
     WHERE tipo_entidade = $1 AND entidade_id = $2
     ORDER BY principal DESC, ordem ASC, criado_em ASC`,
    [tipoEntidade, entidadeId],
  );
  return result.rows;
}

export async function contarImagensDaEntidade(
  tipoEntidade: string,
  entidadeId: number,
): Promise<number> {
  const result = await dbPool.query(
    'SELECT COUNT(*)::int AS total FROM imagens WHERE tipo_entidade = $1 AND entidade_id = $2',
    [tipoEntidade, entidadeId],
  );
  return Number(result.rows[0]?.total ?? 0);
}
