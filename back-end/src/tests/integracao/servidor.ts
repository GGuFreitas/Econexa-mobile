import fastify, { type FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '@config/env.js';
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

export function tokenDe(usuarioId: number, role = 'citizen'): string {
  return jwt.sign(
    { sub: usuarioId, email: `usuario${usuarioId}@exemplo.invalid`, role },
    env.JWT_SECRET,
    { expiresIn: '1h' },
  );
}
