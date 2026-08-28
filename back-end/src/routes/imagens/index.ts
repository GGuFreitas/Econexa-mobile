import type { FastifyInstance } from 'fastify';
import { parse } from '@shared/validate.js';
import { created, ok } from '@shared/http.js';
import { requireAuth } from '@shared/auth.js';
import {
  createImagemSchema,
  listImagensParamsSchema,
} from '@common/imagens/imagens.schemas.js';
import { listImagens, saveImagem } from '@common/imagens/imagens.handler.js';

export async function imagensRoutes(app: FastifyInstance): Promise<void> {
  app.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const body = parse(createImagemSchema, request.body);
    const imagem = await saveImagem(body);
    return created(reply, imagem);
  });

  app.get('/:tipo_entidade/:entidade_id', async (request, reply) => {
    const { tipo_entidade, entidade_id } = parse(listImagensParamsSchema, request.params);
    const imagens = await listImagens(tipo_entidade, entidade_id);
    return ok(reply, imagens);
  });
}
