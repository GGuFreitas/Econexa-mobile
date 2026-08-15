import { FastifyPluginAsync } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '@config/env.js';
import { dbPool } from '@config/database.js';
import { AuthRepository } from '@modules/auth/auth.repository.js';
import { AppError } from '@shared/errors/errorHandler.js';
import { CustomPayload } from '@modules/auth/interface/index;.js';


const usersRoutes: FastifyPluginAsync = async (app) => {
  const repository = new AuthRepository(dbPool);

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

export default usersRoutes;
