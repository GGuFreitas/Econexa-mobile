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
