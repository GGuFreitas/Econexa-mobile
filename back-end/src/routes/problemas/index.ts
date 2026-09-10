import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { parse } from '@shared/validate.js';
import { created, ok } from '@shared/http.js';
import { optionalAuth, requireAuth } from '@shared/auth.js';
import { AppError } from '@shared/errors.js';
import {
  comentarioLimiter,
  criarProblemaLimiter,
  denunciaLimiter,
  encaminhamentoLimiter,
  RateLimiter,
} from '@shared/ratelimit.js';
import {
  alterarStatusProblemaSchema,
  criarProblemaSchema,
  listarProblemasQuerySchema,
} from '@common/problemas/problemas.schemas.js';
import {
  alterarStatusProblema,
  criarProblema,
  listarProblemas,
  obterProblema,
  estatisticasProblemas,
  tendenciasProblemasHandler,
} from '@common/problemas/problemas.handler.js';
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
import { listarEventosQuerySchema } from '@common/problemaEventos/problemaEventos.schemas.js';
import { listarEventosProblema } from '@common/problemaEventos/problemaEventos.handler.js';
import {
  criarEncaminhamentoSchema,
  registrarRespostaSchema,
} from '@common/encaminhamentos/encaminhamentos.schemas.js';
import {
  criarEncaminhamento,
  listarEncaminhamentos,
  reenviarEncaminhamento,
  registrarResposta,
} from '@common/encaminhamentos/encaminhamentos.handler.js';

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id)) {
    throw new AppError('ID inválido.', 400);
  }
  return id;
}

function rateLimitGuard(
  limiter: RateLimiter,
  keyOf: (request: FastifyRequest) => string,
): (request: FastifyRequest, _reply: FastifyReply) => Promise<void> {
  return async (request) => {
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
      const resultado = await criarProblema({ ...body, usuarioId: request.user!.id });
      return resultado.criado ? created(reply, resultado) : ok(reply, resultado);
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

  app.get('/:id', { preHandler: optionalAuth }, async (request, reply) => {
    const id = parseId((request.params as { id: string }).id);
    const problema = await obterProblema(id, request.user?.id, request.user?.role);
    return ok(reply, problema);
  });

  app.patch('/:id/status', { preHandler: requireAuth }, async (request, reply) => {
    const id = parseId((request.params as { id: string }).id);
    const body = parse(alterarStatusProblemaSchema, request.body);
    const problema = await alterarStatusProblema({
      problemaId: id,
      status: body.status,
      usuarioId: request.user!.id,
      role: request.user!.role,
    });
    return ok(reply, problema);
  });

  app.post('/:id/apoios', { preHandler: requireAuth }, async (request, reply) => {
    const id = parseId((request.params as { id: string }).id);
    const resultado = await apoiarProblema(id, request.user!.id);
    return ok(reply, resultado);
  });

  app.delete('/:id/apoios', { preHandler: requireAuth }, async (request, reply) => {
    const id = parseId((request.params as { id: string }).id);
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
      const id = parseId((request.params as { id: string }).id);
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
    const id = parseId((request.params as { id: string }).id);
    const denuncias = await listarDenuncias(id);
    return ok(reply, denuncias);
  });

  app.get('/:id/eventos', async (request, reply) => {
    const id = parseId((request.params as { id: string }).id);
    const query = parse(listarEventosQuerySchema, request.query);
    const eventos = await listarEventosProblema({ ...query, problemaId: id });
    return ok(reply, eventos);
  });

  app.get('/:id/comentarios', { preHandler: optionalAuth }, async (request, reply) => {
    const id = parseId((request.params as { id: string }).id);
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
      const id = parseId((request.params as { id: string }).id);
      const body = parse(criarComentarioSchema, request.body);
      const comentario = await criarComentario({
        problemaId: id,
        usuarioId: request.user!.id,
        conteudo: body.conteudo,
      });
      return created(reply, comentario);
    },
  );

  app.delete(
    '/:id/comentarios/:comentarioId',
    { preHandler: requireAuth },
    async (request, reply) => {
      const id = parseId((request.params as { id: string }).id);
      const comentarioId = parseId((request.params as { comentarioId: string }).comentarioId);
      const resultado = await excluirComentario({
        comentarioId,
        problemaId: id,
        usuarioId: request.user!.id,
      });
      return ok(reply, resultado);
    },
  );

  app.get('/:id/encaminhamentos', { preHandler: requireAuth }, async (request, reply) => {
    const id = parseId((request.params as { id: string }).id);
    const encaminhamentos = await listarEncaminhamentos({
      problemaId: id,
      usuarioId: request.user!.id,
      role: request.user!.role,
    });
    return ok(reply, encaminhamentos);
  });

  app.post(
    '/:id/encaminhamentos',
    {
      preHandler: [
        requireAuth,
        rateLimitGuard(encaminhamentoLimiter, (request) => String(request.user!.id)),
      ],
    },
    async (request, reply) => {
      const id = parseId((request.params as { id: string }).id);
      const body = parse(criarEncaminhamentoSchema, request.body);
      const encaminhamento = await criarEncaminhamento({
        problemaId: id,
        orgaoId: body.orgaoId,
        mensagem: body.mensagem,
        usuarioId: request.user!.id,
        role: request.user!.role,
      });
      return created(reply, encaminhamento);
    },
  );

  app.post(
    '/:id/encaminhamentos/:encaminhamentoId/reenviar',
    {
      preHandler: [
        requireAuth,
        rateLimitGuard(encaminhamentoLimiter, (request) => String(request.user!.id)),
      ],
    },
    async (request, reply) => {
      const id = parseId((request.params as { id: string }).id);
      const encaminhamentoId = parseId(
        (request.params as { encaminhamentoId: string }).encaminhamentoId,
      );
      const encaminhamento = await reenviarEncaminhamento({
        problemaId: id,
        encaminhamentoId,
        usuarioId: request.user!.id,
        role: request.user!.role,
      });
      return ok(reply, encaminhamento);
    },
  );

  app.post(
    '/:id/encaminhamentos/:encaminhamentoId/resposta',
    { preHandler: requireAuth },
    async (request, reply) => {
      const id = parseId((request.params as { id: string }).id);
      const encaminhamentoId = parseId(
        (request.params as { encaminhamentoId: string }).encaminhamentoId,
      );
      const body = parse(registrarRespostaSchema, request.body);
      const encaminhamento = await registrarResposta({
        problemaId: id,
        encaminhamentoId,
        resposta: body.resposta,
        protocolo: body.protocolo,
        usuarioId: request.user!.id,
        role: request.user!.role,
      });
      return ok(reply, encaminhamento);
    },
  );
}
