import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '@shared/errors.js';

export class RateLimiter {
  private windows = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  tryConsume(key: string, cost = 1): boolean {
    const now = Date.now();
    const window = this.windows.get(key);

    if (!window || now >= window.resetAt) {
      this.windows.set(key, { count: cost, resetAt: now + this.windowMs });
      return true;
    }

    if (window.count + cost > this.limit) return false;
    window.count += cost;
    return true;
  }
}

export const criarProblemaLimiter = new RateLimiter(5, 60_000);
export const denunciaLimiter = new RateLimiter(3, 60_000);
export const comentarioLimiter = new RateLimiter(10, 60_000);
export const encaminhamentoLimiter = new RateLimiter(3, 60_000);
export const loginLimiter = new RateLimiter(10, 60_000);
export const registroLimiter = new RateLimiter(5, 60_000);

export function porUsuario(request: FastifyRequest): string {
  return String(request.user!.id);
}

export function porOrigem(request: FastifyRequest): string {
  return request.ip;
}

export function rateLimitGuard(
  limiter: RateLimiter,
  keyOf: (request: FastifyRequest) => string,
): (request: FastifyRequest, reply: FastifyReply) => Promise<void> {
  return async (request) => {
    if (!limiter.tryConsume(keyOf(request))) {
      throw new AppError('Muitas requisições. Tente novamente em instantes.', 429);
    }
  };
}
