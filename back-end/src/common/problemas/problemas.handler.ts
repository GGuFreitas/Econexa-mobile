import { AppError } from '@shared/errors.js';
import { cache } from '@shared/cache.js';
import * as sql from './problemas.sql.js';
import type { CriarProblemaInput, ListarProblemasQuery, Problema } from './problemas.types.js';

const LIST_CACHE_TTL = 30;

export async function criarProblema(input: CriarProblemaInput): Promise<Problema> {
  if (!input.titulo?.trim()) {
    throw new AppError('Título obrigatório.', 400);
  }
  if (input.tags && input.tags.length > 10) {
    throw new AppError('Máximo de 10 tags.', 400);
  }

  const problema = await sql.insertProblema({
    usuarioId: input.usuarioId,
    titulo: input.titulo.trim(),
    descricao: input.descricao?.trim() || undefined,
    causaId: input.causaId,
    tags: input.tags ?? [],
    tipo: input.tipo,
    lat: input.lat,
    lng: input.lng,
    localNome: input.localNome,
    escopo: input.escopo,
  });

  return problema;
}

export async function listarProblemas(query: ListarProblemasQuery): Promise<Problema[]> {
  const cacheKey = `problemas:${JSON.stringify(query)}`;
  const cached = await cache.get<Problema[]>(cacheKey);
  if (cached) return cached;

  const problemas = await sql.listarProblemas(query);
  await cache.set(cacheKey, problemas, LIST_CACHE_TTL);
  return problemas;
}

export async function obterProblema(id: number): Promise<Problema> {
  const problema = await sql.getProblemaById(id);
  if (!problema) {
    throw new AppError('Problema não encontrado.', 404);
  }
  await sql.incrementarVisualizacoes(id);
  return problema;
}
