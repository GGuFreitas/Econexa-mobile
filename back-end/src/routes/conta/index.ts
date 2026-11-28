import type { FastifyInstance } from 'fastify';
import { env } from '@config/env.js';
import { responderHtml } from '@shared/html.js';
import { paginaDeExclusaoDeConta } from '@common/auth/exclusao.pagina.js';
import { paginaDePoliticaDePrivacidade } from '@common/auth/privacidade.pagina.js';

export async function contaRoutes(app: FastifyInstance): Promise<void> {
  app.get('/exclusao', async (_request, reply) =>
    responderHtml(reply, paginaDeExclusaoDeConta(env.CONTATO_PRIVACIDADE)),
  );
  app.get('/privacidade', async (_request, reply) =>
    responderHtml(reply, paginaDePoliticaDePrivacidade(env.CONTATO_PRIVACIDADE)),
  );
}
