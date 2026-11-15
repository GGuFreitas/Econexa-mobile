import { createHash, randomBytes } from 'node:crypto';

export function hashDeSegredo(segredo: string): string {
  return createHash('sha256').update(segredo).digest('hex');
}

export function tokenAleatorio(bytes: number): string {
  return randomBytes(bytes).toString('base64url');
}
