import { AppError } from '@shared/errors.js';
import * as sql from './apoios.sql.js';
import type { ApoioResultado } from './apoios.types.js';

export async function apoiarProblema(problemaId: number, usuarioId: number): Promise<ApoioResultado> {
  const existe = await sql.problemaExiste(problemaId);
  if (!existe) {
    throw new AppError('Problema não encontrado.', 404);
  }

  const jaApoiou = await sql.jaApoiou(problemaId, usuarioId);
  if (jaApoiou) {
    return { apoiado: true, ...(await sql.obterContadores(problemaId)) };
  }

  const peso = await sql.getPesoVoto(usuarioId);
  const inseriu = await sql.inserirApoio(problemaId, usuarioId, peso);
  if (inseriu) {
    await sql.incrementarContadores(problemaId, peso);
  }

  return { apoiado: true, ...(await sql.obterContadores(problemaId)) };
}

export async function desapoiarProblema(problemaId: number, usuarioId: number): Promise<ApoioResultado> {
  const existe = await sql.problemaExiste(problemaId);
  if (!existe) {
    throw new AppError('Problema não encontrado.', 404);
  }

  const pesoRemovido = await sql.removerApoio(problemaId, usuarioId);
  if (pesoRemovido > 0) {
    await sql.decrementarContadores(problemaId, pesoRemovido);
  }

  return { apoiado: false, ...(await sql.obterContadores(problemaId)) };
}
