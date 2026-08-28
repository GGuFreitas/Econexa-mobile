import { dbPool } from '@config/database.js';

export async function problemaExiste(problemaId: number): Promise<boolean> {
  const result = await dbPool.query('SELECT 1 FROM problemas WHERE id = $1', [problemaId]);
  return result.rows.length > 0;
}

export async function jaApoiou(problemaId: number, usuarioId: number): Promise<boolean> {
  const result = await dbPool.query(
    'SELECT 1 FROM problema_apoios WHERE problema_id = $1 AND usuario_id = $2',
    [problemaId, usuarioId],
  );
  return result.rows.length > 0;
}

export async function getPesoVoto(usuarioId: number): Promise<number> {
  const result = await dbPool.query('SELECT peso_voto FROM users WHERE id = $1', [usuarioId]);
  return Number(result.rows[0]?.peso_voto ?? 1);
}

export async function inserirApoio(
  problemaId: number,
  usuarioId: number,
  peso: number,
): Promise<boolean> {
  const result = await dbPool.query(
    `INSERT INTO problema_apoios (problema_id, usuario_id, peso_aplicado)
     VALUES ($1, $2, $3)
     ON CONFLICT (problema_id, usuario_id) DO NOTHING
     RETURNING problema_id`,
    [problemaId, usuarioId, peso],
  );
  return result.rows.length > 0;
}

export async function removerApoio(problemaId: number, usuarioId: number): Promise<number> {
  const result = await dbPool.query(
    'DELETE FROM problema_apoios WHERE problema_id = $1 AND usuario_id = $2 RETURNING peso_aplicado',
    [problemaId, usuarioId],
  );
  if (result.rows.length === 0) return 0;
  return Number(result.rows[0].peso_aplicado);
}

export async function incrementarContadores(problemaId: number, peso: number): Promise<void> {
  await dbPool.query(
    'UPDATE problemas SET cont_apoios = cont_apoios + 1, cont_apoios_ponderados = cont_apoios_ponderados + $2 WHERE id = $1',
    [problemaId, peso],
  );
}

export async function decrementarContadores(problemaId: number, peso: number): Promise<void> {
  await dbPool.query(
    `UPDATE problemas
     SET cont_apoios = GREATEST(cont_apoios - 1, 0),
         cont_apoios_ponderados = GREATEST(cont_apoios_ponderados - $2, 0)
     WHERE id = $1`,
    [problemaId, peso],
  );
}

export async function obterContadores(
  problemaId: number,
): Promise<{ cont_apoios: number; cont_apoios_ponderados: number }> {
  const result = await dbPool.query(
    'SELECT cont_apoios, cont_apoios_ponderados FROM problemas WHERE id = $1',
    [problemaId],
  );
  const row = result.rows[0];
  return {
    cont_apoios: Number(row?.cont_apoios ?? 0),
    cont_apoios_ponderados: Number(row?.cont_apoios_ponderados ?? 0),
  };
}
