import { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { AppError } from '@shared/errors.js';
import { dbPool } from '@config/database.js';
import { env } from '@config/env.js';

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: string;
  emailVerificado: boolean;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

const declaracoesDoAccessToken = z.object({
  sub: z.number().int().positive(),
  sv: z.number().int().nonnegative(),
});

export function contaBloqueada(): AppError {
  return new AppError('Esta conta está bloqueada.', 403, 'CONTA_BLOQUEADA');
}

export function assinarAccessToken(usuarioId: number, sessaoVersao: number): string {
  return jwt.sign({ sub: usuarioId, sv: sessaoVersao }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
  });
}

function lerAccessToken(token: string): { usuarioId: number; sessaoVersao: number } | null {
  try {
    const decodificado = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    const declaracoes = declaracoesDoAccessToken.safeParse(decodificado);
    if (!declaracoes.success) return null;
    return { usuarioId: declaracoes.data.sub, sessaoVersao: declaracoes.data.sv };
  } catch {
    return null;
  }
}

async function autenticar(header: string | undefined): Promise<AuthenticatedUser> {
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError('Token de autenticação ausente.', 401);
  }

  const declaracoes = lerAccessToken(header.slice('Bearer '.length));
  if (!declaracoes) {
    throw new AppError('Token inválido ou expirado.', 401);
  }

  const result = await dbPool.query(
    'SELECT id, email, role, email_verificado, bloqueado_em, sessao_versao FROM users WHERE id = $1',
    [declaracoes.usuarioId],
  );
  const usuario = result.rows[0];

  if (!usuario || usuario.sessao_versao !== declaracoes.sessaoVersao) {
    throw new AppError('Token inválido ou expirado.', 401);
  }
  if (usuario.bloqueado_em) {
    throw contaBloqueada();
  }

  return {
    id: usuario.id,
    email: usuario.email,
    role: usuario.role,
    emailVerificado: usuario.email_verificado,
  };
}

export async function requireAuth(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  request.user = await autenticar(request.headers.authorization);
}

export async function optionalAuth(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const header = request.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) return;

  try {
    request.user = await autenticar(header);
  } catch {
    request.user = undefined;
  }
}
