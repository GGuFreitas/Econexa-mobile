import { normalizarEmail } from '../utils/email';

export function buildLoginPayload(email: string, password: string) {
  return {
    email: normalizarEmail(email),
    password,
  };
}
