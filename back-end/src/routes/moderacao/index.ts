import type { FastifyInstance } from 'fastify';
import { parse } from '@shared/validate.js';
import { ok } from '@shared/http.js';
import { requireAuth } from '@shared/auth.js';
import { AppError } from '@shared/errors.js';
import { bloqueioSchema, filaDeDenunciasQuerySchema } from '@common/moderacao/moderacao.schemas.js';
import {
  bloquearConta,
  descartarDenuncias,
  desbloquearConta,
  filaDeDenuncias,
} from '@common/moderacao/moderacao.handler.js';

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) {
    throw new AppError('ID inválido.', 400);
  }
  return id;
}

export async function moderacaoRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/denuncias', async (request, reply) => {
    const query = parse(filaDeDenunciasQuerySchema, request.query);
    return ok(reply, await filaDeDenuncias(request.user!, query));
  });

  app.delete('/denuncias/:problemaId', async (request, reply) => {
    const { problemaId } = request.params as { problemaId: string };
    await descartarDenuncias(request.user!, parseId(problemaId));
    return reply.status(204).send();
  });

  app.post('/usuarios/:id/bloqueio', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { motivo } = parse(bloqueioSchema, request.body);
    await bloquearConta(request.user!, parseId(id), motivo);
    return reply.status(204).send();
  });

  app.delete('/usuarios/:id/bloqueio', async (request, reply) => {
    const { id } = request.params as { id: string };
    await desbloquearConta(request.user!, parseId(id));
    return reply.status(204).send();
  });
}
