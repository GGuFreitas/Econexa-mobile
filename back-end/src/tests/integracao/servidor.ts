import fastify, { type FastifyInstance } from 'fastify';
import { assinarAccessToken } from '@shared/auth.js';
import { errorHandler } from '@shared/errors.js';
import { registerRoutes } from '@routes/index.js';

export async function criarServidor(): Promise<FastifyInstance> {
  const app = fastify({ logger: false });

  app.setErrorHandler(errorHandler);
  await app.register(
    async (api) => {
      await registerRoutes(api);
    },
    { prefix: '/api' },
  );
  await app.ready();

  return app;
}

export function tokenDe(usuarioId: number, sessaoVersao = 0): string {
  return assinarAccessToken(usuarioId, sessaoVersao);
}
