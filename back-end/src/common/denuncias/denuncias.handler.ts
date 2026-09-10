import { AppError } from '@shared/errors.js';
import { ehAdmin } from '@common/abilities.js';
import * as sql from './denuncias.sql.js';
import type { CriarDenunciaInput, Denuncia } from './denuncias.types.js';

export async function criarDenuncia(input: CriarDenunciaInput): Promise<Denuncia> {
  const existe = await sql.problemaExiste(input.problemaId);
  if (!existe) {
    throw new AppError('Problema não encontrado.', 404);
  }

  return sql.inserirDenuncia(input);
}

export async function listarDenuncias(problemaId: number, role: string): Promise<Denuncia[]> {
  if (!ehAdmin(role)) {
    throw new AppError('Apenas a moderação pode ver quem denunciou.', 403);
  }
  return sql.listarDenuncias(problemaId);
}

export async function contarDenuncias(problemaId: number): Promise<number> {
  return sql.contarDenuncias(problemaId);
}
