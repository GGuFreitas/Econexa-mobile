import type { FastifyInstance } from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import { parse } from '@shared/validate.js';
import { created, ok } from '@shared/http.js';
import { requireAuth } from '@shared/auth.js';
import { AppError } from '@shared/errors.js';
import { listImagensParamsSchema } from '@common/imagens/imagens.schemas.js';
import {
  enviarEvidenciaProblema,
  listImagens,
  TAMANHO_MAXIMO_IMAGEM,
} from '@common/imagens/imagens.handler.js';

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id)) {
    throw new AppError('ID inválido.', 400);
  }
  return id;
}

export async function imagensRoutes(app: FastifyInstance): Promise<void> {
  await app.register(fastifyMultipart, {
    limits: { fileSize: TAMANHO_MAXIMO_IMAGEM, files: 1 },
  });

  app.post('/upload/problema/:problemaId', { preHandler: requireAuth }, async (request, reply) => {
    const problemaId = parseId((request.params as { problemaId: string }).problemaId);
    const arquivo = await request.file();

    if (!arquivo) {
      throw new AppError('Envie a imagem no campo "file".', 400);
    }

    let conteudo: Buffer;
    try {
      conteudo = await arquivo.toBuffer();
    } catch (erro) {
      if ((erro as { code?: string }).code === 'FST_REQ_FILE_TOO_LARGE') {
        throw new AppError('A imagem deve ter no máximo 5 MB.', 413);
      }
      throw erro;
    }

    if (arquivo.file.truncated) {
      throw new AppError('A imagem deve ter no máximo 5 MB.', 413);
    }

    const imagem = await enviarEvidenciaProblema({
      problemaId,
      usuarioId: request.user!.id,
      role: request.user!.role,
      nomeArquivo: arquivo.filename,
      mimetype: arquivo.mimetype,
      conteudo,
    });

    return created(reply, imagem);
  });

  app.get('/:tipo_entidade/:entidade_id', async (request, reply) => {
    const { tipo_entidade, entidade_id } = parse(listImagensParamsSchema, request.params);
    const imagens = await listImagens(tipo_entidade, entidade_id);
    return ok(reply, imagens);
  });
}
