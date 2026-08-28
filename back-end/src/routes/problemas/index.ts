import type { FastifyInstance } from 'fastify';
import { parse } from '@shared/validate.js';
import { created, ok } from '@shared/http.js';
import { requireAuth } from '@shared/auth.js';
import { AppError } from '@shared/errors.js';
import {
  criarProblemaSchema,
  listarProblemasQuerySchema,
} from '@common/problemas/problemas.schemas.js';
import { criarProblema, listarProblemas, obterProblema } from '@common/problemas/problemas.handler.js';

export async function problemasRoutes(app: FastifyInstance): Promise<void> {
  app.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const body = parse(criarProblemaSchema, request.body);
    const problema = await criarProblema({ ...body, usuarioId: request.user!.id });
    return created(reply, problema);
  });

  app.get('/', async (request, reply) => {
    const query = parse(listarProblemasQuerySchema, request.query);
    const problemas = await listarProblemas(query);
    return ok(reply, problemas);
  });

  app.get('/:id', async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id)) {
      throw new AppError('ID inválido.', 400);
    }
    const problema = await obterProblema(id);
    return ok(reply, problema);
  });
}
