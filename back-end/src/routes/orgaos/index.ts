import type { FastifyInstance } from 'fastify';
import { ok } from '@shared/http.js';
import { requireAuth } from '@shared/auth.js';
import { listarOrgaos } from '@common/encaminhamentos/encaminhamentos.handler.js';

export async function orgaosRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', { preHandler: requireAuth }, async (_request, reply) => {
    const orgaos = await listarOrgaos();
    return ok(reply, orgaos);
  });
}
