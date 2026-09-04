import { randomUUID } from 'node:crypto';
import { AppError } from '@shared/errors.js';
import { emTransacao, type Executor } from '@shared/transacao.js';
import { enviarObjeto, removerObjeto } from '@shared/storage.js';
import { usuarioApoiou } from '@common/apoios/apoios.sql.js';
import {
  podeAdicionarEvidencia,
  podeGerenciarProblema,
} from '@common/problemas/problemas.handler.js';
import { getProblemaById } from '@common/problemas/problemas.sql.js';
import { registrarEvento } from '@common/problemaEventos/problemaEventos.handler.js';
import * as sql from './imagens.sql.js';
import type { EvidenciaProblemaInput, Imagem, ImagemInput } from './imagens.types.js';

export const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024;

export const EXTENSAO_POR_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function assinaturaConfere(mimetype: string, conteudo: Buffer): boolean {
  if (mimetype === 'image/jpeg') {
    return conteudo.length > 3 && conteudo[0] === 0xff && conteudo[1] === 0xd8 && conteudo[2] === 0xff;
  }
  if (mimetype === 'image/png') {
    return conteudo.length > 8 && conteudo.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mimetype === 'image/webp') {
    return (
      conteudo.length > 12 &&
      conteudo.subarray(0, 4).toString('ascii') === 'RIFF' &&
      conteudo.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }
  return false;
}

export function validarArquivoImagem(mimetype: string, conteudo: Buffer): void {
  if (!EXTENSAO_POR_MIME[mimetype]) {
    throw new AppError('Envie uma imagem JPEG, PNG ou WebP.', 415);
  }
  if (conteudo.length === 0) {
    throw new AppError('O arquivo enviado está vazio.', 400);
  }
  if (conteudo.length > TAMANHO_MAXIMO_IMAGEM) {
    throw new AppError('A imagem deve ter no máximo 5 MB.', 413);
  }
  if (!assinaturaConfere(mimetype, conteudo)) {
    throw new AppError('O arquivo enviado não é uma imagem válida.', 415);
  }
}

export async function saveImagem(input: ImagemInput, executor?: Executor): Promise<Imagem> {
  if (!input.url) {
    throw new AppError('Informe a url da imagem.', 400);
  }

  const imagem = await sql.insertImagem(
    {
      tipo_entidade: input.tipo_entidade,
      entidade_id: input.entidade_id,
      url: input.url,
      principal: input.principal ?? false,
      ordem: input.ordem ?? 0,
    },
    executor,
  );

  return imagem;
}

export async function listImagens(tipoEntidade: string, entidadeId: number): Promise<Imagem[]> {
  return sql.listImagensByEntity(tipoEntidade, entidadeId);
}

export async function enviarEvidenciaProblema(
  input: EvidenciaProblemaInput,
): Promise<Imagem> {
  validarArquivoImagem(input.mimetype, input.conteudo);

  const problema = await getProblemaById(input.problemaId);
  if (!problema) {
    throw new AppError('Problema não encontrado.', 404);
  }
  const gerencia = podeGerenciarProblema(problema, input.usuarioId, input.role);
  const apoiou = gerencia ? false : await usuarioApoiou(input.problemaId, input.usuarioId);
  if (!podeAdicionarEvidencia(problema, input.usuarioId, input.role, apoiou)) {
    throw new AppError('Apoie este problema para poder adicionar evidência a ele.', 403);
  }

  const existentes = await sql.contarImagensDaEntidade('problema', input.problemaId);
  const chave = `problema/${input.problemaId}/${randomUUID()}.${EXTENSAO_POR_MIME[input.mimetype]}`;
  const url = await enviarObjeto(chave, input.conteudo, input.mimetype);

  try {
    return await emTransacao(async (executor) => {
      const imagem = await sql.insertImagem(
        {
          tipo_entidade: 'problema',
          entidade_id: input.problemaId,
          url,
          principal: existentes === 0,
          ordem: existentes,
        },
        executor,
      );

      await registrarEvento(
        {
          problemaId: input.problemaId,
          tipo: 'EVIDENCIA_ADICIONADA',
          usuarioId: input.usuarioId,
          dados: { imagem_id: imagem.id, url: imagem.url },
        },
        executor,
      );

      return imagem;
    });
  } catch (erro) {
    await removerObjeto(chave);
    throw erro;
  }
}
