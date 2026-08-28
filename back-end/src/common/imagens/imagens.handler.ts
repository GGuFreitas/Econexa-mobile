import { AppError } from '@shared/errors.js';
import * as sql from './imagens.sql.js';
import type { ImagemInput } from './imagens.types.js';

export async function saveImagem(input: ImagemInput) {
  if (!input.url) {
    throw new AppError('Informe a url da imagem.', 400);
  }

  const imagem = await sql.insertImagem({
    tipo_entidade: input.tipo_entidade,
    entidade_id: input.entidade_id,
    url: input.url,
    principal: input.principal ?? false,
    ordem: input.ordem ?? 0,
  });

  return imagem;
}

export async function listImagens(tipoEntidade: string, entidadeId: number) {
  return sql.listImagensByEntity(tipoEntidade, entidadeId);
}
