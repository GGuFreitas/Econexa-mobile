import { FastifyPluginAsync } from 'fastify';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '@config/env.js';
import { dbPool } from '@config/database.js';
import { AuthRepository } from '@modules/auth/auth.repository.js';
import { LoginUserService } from '@modules/auth/login-user.service.js';
import { RegisterUserService } from '@modules/auth/register-user.service.js';
import { AppError } from '@shared/errors/errorHandler.js';
import { CustomPayload } from '@modules/auth/interface/index;.js';

const registerSchema = z.object({
  nome: z.string().min(2, 'Informe o nome completo.'),
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter ao menos 6 caracteres.'),
  role: z.enum(['citizen', 'specialist', 'organization']).default('citizen'),
});

const loginSchema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter ao menos 6 caracteres.'),
});

const authRoutes: FastifyPluginAsync = async (app) => {
  const repository = new AuthRepository(dbPool);
  const loginService = new LoginUserService(repository);
  const registerService = new RegisterUserService(repository);

  app.post('/register', async (request, reply) => {
    const payload = registerSchema.parse(request.body);
    const user = await registerService.execute(payload);

    return reply.code(201).send({
      message: 'Usuário cadastrado com sucesso.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        vote_weight: user.vote_weight,
      },
    });
  });

  app.post('/login', async (request, reply) => {
    const payload = loginSchema.parse(request.body);
    const result = await loginService.execute(payload);

    return reply.code(200).send({
      message: 'Login realizado com sucesso.',
      token: result.token,
      user: result.user,
    });
  });

  app.get('/me', async (request, reply) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token de autenticação ausente.', 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, env.JWT_SECRET)

    if (typeof decoded === 'string' || !decoded) {
      throw new AppError('Token inválido ou malformado.', 401);
    }

    const payload = decoded as unknown as CustomPayload;
    const user = await repository.findUserById(payload.sub);

    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    return reply.send({
      user: {
        id: user.id,
        name: user.nome,
        email: user.email,
        role: user.role,
        vote_weight: user.peso_voto,
      },
    });
  });
};

export default authRoutes;
