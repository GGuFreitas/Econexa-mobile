import { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { AppError } from '@shared/errors.js';
import { env } from '@config/env.js';

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

function verificarToken(header: string): AuthenticatedUser | null {
  const token = header.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as unknown as { sub: number; email: string; role: string };
    return { id: decoded.sub, email: decoded.email, role: decoded.role };
  } catch {
    return null;
  }
}

export async function requireAuth(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const header = request.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError('Token de autenticação ausente.', 401);
  }

  const user = verificarToken(header);

  if (!user) {
    throw new AppError('Token inválido ou expirado.', 401);
  }

  request.user = user;
}

export async function optionalAuth(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const header = request.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) return;

  request.user = verificarToken(header) ?? undefined;
}
