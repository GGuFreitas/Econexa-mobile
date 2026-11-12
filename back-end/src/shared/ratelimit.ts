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

const UM_MINUTO = 60_000;
const UMA_HORA = 60 * UM_MINUTO;

export const criarProblemaLimiter = new RateLimiter(5, UM_MINUTO);
export const denunciaLimiter = new RateLimiter(3, UM_MINUTO);
export const comentarioLimiter = new RateLimiter(10, UM_MINUTO);
export const encaminhamentoLimiter = new RateLimiter(3, UM_MINUTO);
export const loginLimiter = new RateLimiter(10, UM_MINUTO);
export const registroLimiter = new RateLimiter(5, UM_MINUTO);
export const renovacaoSessaoLimiter = new RateLimiter(30, UM_MINUTO);
export const confirmacaoEmailLimiter = new RateLimiter(20, UM_MINUTO);
export const reenvioVerificacaoLimiter = new RateLimiter(3, UMA_HORA);
export const esqueciSenhaLimiter = new RateLimiter(3, UMA_HORA);
export const esqueciSenhaPorEmailLimiter = new RateLimiter(3, UMA_HORA);
export const redefinicaoSenhaLimiter = new RateLimiter(10, UM_MINUTO);

export function porUsuario(request: FastifyRequest): string {
  return String(request.user!.id);
}

export function porOrigem(request: FastifyRequest): string {
  return request.ip;
}

export function porEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function exigirCota(limiter: RateLimiter, chave: string): void {
  if (!limiter.tryConsume(chave)) {
    throw new AppError('Muitas requisições. Tente novamente em instantes.', 429);
  }
}

export function rateLimitGuard(
  limiter: RateLimiter,
  keyOf: (request: FastifyRequest) => string,
): (request: FastifyRequest, reply: FastifyReply) => Promise<void> {
  return async (request) => {
    exigirCota(limiter, keyOf(request));
  };
}
