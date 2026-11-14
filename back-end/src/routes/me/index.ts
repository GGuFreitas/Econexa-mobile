import type { FastifyInstance } from 'fastify';
import { parse } from '@shared/validate.js';
import { ok } from '@shared/http.js';
import { requireAuth } from '@shared/auth.js';
import { paginacaoSchema } from '@common/me/me.schemas.js';
import {
  acoesDoUsuario,
  problemasApoiados,
  problemasRelatados,
  resumoDoUsuario,
} from '@common/me/me.handler.js';

export async function meRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/resumo', async (request, reply) => {
    return ok(reply, await resumoDoUsuario(request.user!.id));
  });

  app.get('/relatados', async (request, reply) => {
    const paginacao = parse(paginacaoSchema, request.query);
    return ok(reply, await problemasRelatados(request.user!.id, paginacao));
  });

  app.get('/apoiados', async (request, reply) => {
    const paginacao = parse(paginacaoSchema, request.query);
    return ok(reply, await problemasApoiados(request.user!.id, paginacao));
  });

  app.get('/acoes', async (request, reply) => {
    const paginacao = parse(paginacaoSchema, request.query);
    return ok(reply, await acoesDoUsuario(request.user!.id, paginacao));
  });
}
