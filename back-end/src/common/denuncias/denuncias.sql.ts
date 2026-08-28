import { dbPool } from '@config/database.js';
import type { CriarDenunciaInput, Denuncia } from './denuncias.types.js';

export async function problemaExiste(problemaId: number): Promise<boolean> {
  const result = await dbPool.query('SELECT 1 FROM problemas WHERE id = $1', [problemaId]);
  return result.rows.length > 0;
}

export async function inserirDenuncia(input: CriarDenunciaInput): Promise<Denuncia> {
  const result = await dbPool.query(
    `INSERT INTO problema_denuncias (problema_id, usuario_id, motivo)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [input.problemaId, input.usuarioId, input.motivo],
  );
  return result.rows[0];
}

export async function listarDenuncias(problemaId: number): Promise<Denuncia[]> {
  const result = await dbPool.query(
    `SELECT * FROM problema_denuncias WHERE problema_id = $1 ORDER BY criado_em DESC`,
    [problemaId],
  );
  return result.rows;
}

export async function contarDenuncias(problemaId: number): Promise<number> {
  const result = await dbPool.query(
    `SELECT COUNT(*)::int AS total FROM problema_denuncias WHERE problema_id = $1`,
    [problemaId],
  );
  return Number(result.rows[0]?.total ?? 0);
}
