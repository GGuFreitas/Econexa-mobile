import { dbPool } from '@config/database.js';
import type { Executor } from '@shared/transacao.js';
import type { ContadoresApoio } from './apoios.types.js';

function contadores(row: Record<string, unknown> | undefined): ContadoresApoio {
  return {
    cont_apoios: Number(row?.cont_apoios ?? 0),
    cont_apoios_ponderados: Number(row?.cont_apoios_ponderados ?? 0),
  };
}

export async function problemaExiste(
  problemaId: number,
  executor: Executor = dbPool,
): Promise<boolean> {
  const result = await executor.query('SELECT 1 FROM problemas WHERE id = $1', [problemaId]);
  return result.rows.length > 0;
}

export async function usuarioApoiou(problemaId: number, usuarioId: number): Promise<boolean> {
  const result = await dbPool.query(
    'SELECT 1 FROM problema_apoios WHERE problema_id = $1 AND usuario_id = $2',
    [problemaId, usuarioId],
  );
  return result.rows.length > 0;
}

export async function aplicarApoio(
  problemaId: number,
  usuarioId: number,
  executor: Executor = dbPool,
): Promise<ContadoresApoio | null> {
  const result = await executor.query(
    `WITH novo AS (
       INSERT INTO problema_apoios (problema_id, usuario_id, peso_aplicado)
       SELECT $1, $2, u.peso_voto FROM users u WHERE u.id = $2
       ON CONFLICT (problema_id, usuario_id) DO NOTHING
       RETURNING peso_aplicado
     )
     UPDATE problemas p
     SET cont_apoios = p.cont_apoios + 1,
         cont_apoios_ponderados = p.cont_apoios_ponderados + (SELECT peso_aplicado FROM novo),
         atualizado_em = now()
     WHERE p.id = $1 AND EXISTS (SELECT 1 FROM novo)
     RETURNING p.cont_apoios, p.cont_apoios_ponderados`,
    [problemaId, usuarioId],
  );
  return result.rows.length > 0 ? contadores(result.rows[0]) : null;
}

export async function retirarApoio(
  problemaId: number,
  usuarioId: number,
  executor: Executor = dbPool,
): Promise<ContadoresApoio | null> {
  const result = await executor.query(
    `WITH removido AS (
       DELETE FROM problema_apoios
       WHERE problema_id = $1 AND usuario_id = $2
       RETURNING peso_aplicado
     )
     UPDATE problemas p
     SET cont_apoios = p.cont_apoios - 1,
         cont_apoios_ponderados = p.cont_apoios_ponderados - (SELECT peso_aplicado FROM removido),
         atualizado_em = now()
     WHERE p.id = $1 AND EXISTS (SELECT 1 FROM removido)
     RETURNING p.cont_apoios, p.cont_apoios_ponderados`,
    [problemaId, usuarioId],
  );
  return result.rows.length > 0 ? contadores(result.rows[0]) : null;
}

export async function obterContadores(
  problemaId: number,
  executor: Executor = dbPool,
): Promise<ContadoresApoio> {
  const result = await executor.query(
    'SELECT cont_apoios, cont_apoios_ponderados FROM problemas WHERE id = $1',
    [problemaId],
  );
  return contadores(result.rows[0]);
}
