import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { parse } from '@shared/validate.js';
import { created, ok } from '@shared/http.js';
import { optionalAuth, requireAuth } from '@shared/auth.js';
import { AppError } from '@shared/errors.js';
import { comentarioLimiter, criarProblemaLimiter, denunciaLimiter, RateLimiter } from '@shared/ratelimit.js';
import {
  criarProblemaSchema,
  listarProblemasQuerySchema,
} from '@common/problemas/problemas.schemas.js';
import { criarProblema, listarProblemas, obterProblema, estatisticasProblemas, tendenciasProblemasHandler } from '@common/problemas/problemas.handler.js';
import { apoiarProblema, desapoiarProblema } from '@common/apoios/apoios.handler.js';
import { criarDenunciaSchema } from '@common/denuncias/denuncias.schemas.js';
import { criarDenuncia, listarDenuncias } from '@common/denuncias/denuncias.handler.js';
import {
  criarComentarioSchema,
  listarComentariosQuerySchema,
} from '@common/comentarios/comentarios.schemas.js';
import {
  criarComentario,
  excluirComentario,
  listarComentarios,
} from '@common/comentarios/comentarios.handler.js';

function rateLimitGuard(
  limiter: RateLimiter,
  keyOf: (request: FastifyRequest) => string,
): (request: FastifyRequest, _reply: FastifyReply) => void {
  return (request) => {
    if (!limiter.tryConsume(keyOf(request))) {
      throw new AppError('Muitas requisições. Tente novamente em instantes.', 429);
    }
  };
}

export async function problemasRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/',
    {
      preHandler: [
        requireAuth,
        rateLimitGuard(criarProblemaLimiter, (request) => String(request.user!.id)),
      ],
    },
    async (request, reply) => {
      const body = parse(criarProblemaSchema, request.body);
      const problema = await criarProblema({ ...body, usuarioId: request.user!.id });
      return created(reply, problema);
    },
  );

  app.get('/', async (request, reply) => {
    const query = parse(listarProblemasQuerySchema, request.query);
    const problemas = await listarProblemas(query);
    return ok(reply, problemas);
  });

  app.get('/estatisticas', async (request, reply) => {
    const query = parse(listarProblemasQuerySchema, request.query);
    const stats = await estatisticasProblemas(query);
    return ok(reply, stats);
  });

  app.get('/tendencias', async (request, reply) => {
    const query = parse(listarProblemasQuerySchema, request.query);
    const tendencias = await tendenciasProblemasHandler(query);
    return ok(reply, tendencias);
  });

  app.get('/:id', async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id)) {
      throw new AppError('ID inválido.', 400);
    }
    const problema = await obterProblema(id);
    return ok(reply, problema);
  });

  app.post('/:id/apoios', { preHandler: requireAuth }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id)) {
      throw new AppError('ID inválido.', 400);
    }
    const resultado = await apoiarProblema(id, request.user!.id);
    return ok(reply, resultado);
  });

  app.delete('/:id/apoios', { preHandler: requireAuth }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id)) {
      throw new AppError('ID inválido.', 400);
    }
    const resultado = await desapoiarProblema(id, request.user!.id);
    return ok(reply, resultado);
  });

  app.post(
    '/:id/denuncias',
    {
      preHandler: [
        requireAuth,
        rateLimitGuard(denunciaLimiter, (request) => String(request.user!.id)),
      ],
    },
    async (request, reply) => {
      const id = Number((request.params as { id: string }).id);
      if (!Number.isInteger(id)) {
        throw new AppError('ID inválido.', 400);
      }
      const body = parse(criarDenunciaSchema, request.body);
      const denuncia = await criarDenuncia({
        problemaId: id,
        usuarioId: request.user!.id,
        motivo: body.motivo,
      });
      return created(reply, denuncia);
    },
  );

  app.get('/:id/denuncias', { preHandler: requireAuth }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id)) {
      throw new AppError('ID inválido.', 400);
    }
    const denuncias = await listarDenuncias(id);
    return ok(reply, denuncias);
  });

  app.get('/:id/comentarios', { preHandler: optionalAuth }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    if (!Number.isInteger(id)) {
      throw new AppError('ID inválido.', 400);
    }
    const query = parse(listarComentariosQuerySchema, request.query);
    const comentarios = await listarComentarios({
      ...query,
      problemaId: id,
      usuarioId: request.user?.id,
    });
    return ok(reply, comentarios);
  });

  app.post(
    '/:id/comentarios',
    {
      preHandler: [
        requireAuth,
        rateLimitGuard(comentarioLimiter, (request) => String(request.user!.id)),
      ],
    },
    async (request, reply) => {
      const id = Number((request.params as { id: string }).id);
      if (!Number.isInteger(id)) {
        throw new AppError('ID inválido.', 400);
      }
      const body = parse(criarComentarioSchema, request.body);
      const comentario = await criarComentario({
        problemaId: id,
        usuarioId: request.user!.id,
        conteudo: body.conteudo,
      });
      return created(reply, comentario);
    },
  );

  app.delete('/:id/comentarios/:comentarioId', { preHandler: requireAuth }, async (request, reply) => {
    const id = Number((request.params as { id: string }).id);
    const comentarioId = Number((request.params as { comentarioId: string }).comentarioId);
    if (!Number.isInteger(id) || !Number.isInteger(comentarioId)) {
      throw new AppError('ID inválido.', 400);
    }
    const resultado = await excluirComentario({
      comentarioId,
      problemaId: id,
      usuarioId: request.user!.id,
    });
    return ok(reply, resultado);
  });
}
