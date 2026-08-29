import type { FastifyInstance } from 'fastify';
import { parse } from '@shared/validate.js';
import { created, ok } from '@shared/http.js';
import { requireAuth } from '@shared/auth.js';
import { AppError } from '@shared/errors.js';
import {
  criarEventoSchema,
  listarEventosQuerySchema,
  vincularProblemaSchema,
} from '@common/eventos/eventos.schemas.js';
import {
  criarEvento,
  listarEventos,
  obterEvento,
  vincularProblema,
  inscreverEmEvento,
  desinscreverDeEvento,
  estatisticasEvento,
} from '@common/eventos/eventos.handler.js';

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id)) {
    throw new AppError('ID inválido.', 400);
  }
  return id;
}

export async function eventosRoutes(app: FastifyInstance): Promise<void> {
  app.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const body = parse(criarEventoSchema, request.body);
    const evento = await criarEvento({ ...body, usuarioId: request.user!.id });
    return created(reply, evento);
  });

  app.get('/', async (request, reply) => {
    const query = parse(listarEventosQuerySchema, request.query);
    const eventos = await listarEventos(query);
    return ok(reply, eventos);
  });

  app.get('/:id', async (request, reply) => {
    const evento = await obterEvento(parseId((request.params as { id: string }).id));
    return ok(reply, evento);
  });

  app.get('/:id/estatisticas', async (request, reply) => {
    const id = parseId((request.params as { id: string }).id);
    await obterEvento(id);
    const stats = await estatisticasEvento(id);
    return ok(reply, stats);
  });

  app.post(
    '/:id/problemas/:problemaId',
    { preHandler: requireAuth },
    async (request, reply) => {
      const id = parseId((request.params as { id: string }).id);
      const problemaId = parseId((request.params as { problemaId: string }).problemaId);
      const body = parse(vincularProblemaSchema, request.body);
      await vincularProblema({
        eventoId: id,
        problemaId,
        usuarioId: request.user!.id,
        resolveu: body.resolveu,
      });
      return created(reply, { vinculado: true });
    },
  );

  app.post('/:id/inscricoes', { preHandler: requireAuth }, async (request, reply) => {
    const id = parseId((request.params as { id: string }).id);
    const resultado = await inscreverEmEvento(id, request.user!.id);
    return ok(reply, resultado);
  });

  app.delete('/:id/inscricoes', { preHandler: requireAuth }, async (request, reply) => {
    const id = parseId((request.params as { id: string }).id);
    const resultado = await desinscreverDeEvento(id, request.user!.id);
    return ok(reply, resultado);
  });
}
