import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

export function hashDeSegredo(segredo: string): string {
  return createHash('sha256').update(segredo).digest('hex');
}

export function tokenAleatorio(bytes: number): string {
  return randomBytes(bytes).toString('base64url');
}

export function codigoDeSeisDigitos(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function hashesIguais(hashA: string, hashB: string): boolean {
  const a = Buffer.from(hashA, 'utf8');
  const b = Buffer.from(hashB, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}
