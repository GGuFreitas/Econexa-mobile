import type { FastifyInstance } from 'fastify';
import { authRoutes } from './auth/index.js';
import { imagensRoutes } from './imagens/index.js';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(imagensRoutes, { prefix: '/imagens' });
}
