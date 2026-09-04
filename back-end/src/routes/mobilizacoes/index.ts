import type { FastifyInstance } from 'fastify';
import { parse } from '@shared/validate.js';
import { created, ok } from '@shared/http.js';
import { optionalAuth, requireAuth } from '@shared/auth.js';
import { AppError } from '@shared/errors.js';
import {
  atualizarMobilizacaoSchema,
  atualizarStatusMobilizacaoSchema,
  criarMobilizacaoSchema,
  listarMobilizacoesQuerySchema,
  resultadoMobilizacaoSchema,
} from '@common/mobilizacoes/mobilizacoes.schemas.js';
import {
  atualizarMobilizacao,
  atualizarStatusMobilizacao,
  criarMobilizacao,
  listarMobilizacoes,
  obterMobilizacao,
  participarDaMobilizacao,
  registrarResultadoMobilizacao,
  sairDaMobilizacao,
} from '@common/mobilizacoes/mobilizacoes.handler.js';

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id)) {
    throw new AppError('ID inválido.', 400);
  }
  return id;
}

export async function mobilizacoesRoutes(app: FastifyInstance): Promise<void> {
  app.post('/', { preHandler: requireAuth }, async (request, reply) => {
    const body = parse(criarMobilizacaoSchema, request.body);
    const mobilizacao = await criarMobilizacao({ ...body, usuarioId: request.user!.id });
    return created(reply, mobilizacao);
  });

  app.get('/', async (request, reply) => {
    const query = parse(listarMobilizacoesQuerySchema, request.query);
    const mobilizacoes = await listarMobilizacoes(query);
    return ok(reply, mobilizacoes);
  });

  app.get('/:id', { preHandler: optionalAuth }, async (request, reply) => {
    const mobilizacao = await obterMobilizacao(
      parseId((request.params as { id: string }).id),
      request.user?.id,
      request.user?.role,
    );
    return ok(reply, mobilizacao);
  });

  app.patch('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const id = parseId((request.params as { id: string }).id);
    const body = parse(atualizarMobilizacaoSchema, request.body);
    const mobilizacao = await atualizarMobilizacao(
      id,
      body,
      request.user!.id,
      request.user!.role,
    );
    return ok(reply, mobilizacao);
  });

  app.patch('/:id/status', { preHandler: requireAuth }, async (request, reply) => {
    const id = parseId((request.params as { id: string }).id);
    const { status } = parse(atualizarStatusMobilizacaoSchema, request.body);
    const mobilizacao = await atualizarStatusMobilizacao(
      id,
      status,
      request.user!.id,
      request.user!.role,
    );
    return ok(reply, mobilizacao);
  });

  app.post('/:id/resultado', { preHandler: requireAuth }, async (request, reply) => {
    const id = parseId((request.params as { id: string }).id);
    const body = parse(resultadoMobilizacaoSchema, request.body);
    const mobilizacao = await registrarResultadoMobilizacao(
      id,
      body,
      request.user!.id,
      request.user!.role,
    );
    return created(reply, mobilizacao);
  });

  app.post('/:id/participar', { preHandler: requireAuth }, async (request, reply) => {
    const id = parseId((request.params as { id: string }).id);
    const resultado = await participarDaMobilizacao(id, request.user!.id);
    return ok(reply, resultado);
  });

  app.delete('/:id/participar', { preHandler: requireAuth }, async (request, reply) => {
    const id = parseId((request.params as { id: string }).id);
    const resultado = await sairDaMobilizacao(id, request.user!.id);
    return ok(reply, resultado);
  });
}
