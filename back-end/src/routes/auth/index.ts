import type { FastifyInstance } from 'fastify';
import { parse } from '@shared/validate.js';
import { created, ok } from '@shared/http.js';
import { requireAuth } from '@shared/auth.js';
import { loginSchema, registerSchema } from '@common/auth/auth.schemas.js';
import { getMe, loginUser, registerUser } from '@common/auth/auth.handler.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/register', async (request, reply) => {
    const body = parse(registerSchema, request.body);
    const result = await registerUser(body);
    return created(reply, {
      message: 'Usuário cadastrado com sucesso.',
      user: result.user,
    });
  });

  app.post('/login', async (request, reply) => {
    const body = parse(loginSchema, request.body);
    const result = await loginUser(body);
    return ok(reply, {
      message: 'Login realizado com sucesso.',
      token: result.token,
      user: result.user,
    });
  });

  app.get('/me', { preHandler: requireAuth }, async (request, reply) => {
    const result = await getMe(request.user!.id);
    return ok(reply, { user: result.user });
  });
}
