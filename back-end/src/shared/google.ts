import { createRemoteJWKSet, errors, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from 'jose';
import { z } from 'zod';
import { AppError } from '@shared/errors.js';
import { env } from '@config/env.js';

const CHAVES_DO_GOOGLE = new URL('https://www.googleapis.com/oauth2/v3/certs');
const EMISSORES_DO_GOOGLE = ['accounts.google.com', 'https://accounts.google.com'];

const ERROS_DO_TOKEN = [
  errors.JWTClaimValidationFailed,
  errors.JWTExpired,
  errors.JWTInvalid,
  errors.JWSInvalid,
  errors.JWSSignatureVerificationFailed,
  errors.JWKSNoMatchingKey,
  errors.JWKSMultipleMatchingKeys,
  errors.JOSEAlgNotAllowed,
  errors.JOSENotSupported,
];

const declaracoesDoGoogle = z.object({
  sub: z.string().min(1).max(255),
  email: z.email().max(255),
  email_verified: z.union([z.boolean(), z.enum(['true', 'false'])]).optional(),
  name: z.string().optional(),
});

export interface PerfilGoogle {
  sub: string;
  email: string;
  emailVerificado: boolean;
  nome?: string;
}

let chavesRemotas: JWTVerifyGetKey | null = null;

function chavesDoGoogle(): JWTVerifyGetKey {
  chavesRemotas ??= createRemoteJWKSet(CHAVES_DO_GOOGLE);
  return chavesRemotas;
}

function tokenRecusado(): AppError {
  return new AppError('Não foi possível confirmar o login com o Google.', 401);
}

export async function verificarIdTokenGoogle(
  idToken: string,
  chaves: JWTVerifyGetKey = chavesDoGoogle(),
): Promise<PerfilGoogle> {
  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(idToken, chaves, {
      algorithms: ['RS256'],
      issuer: EMISSORES_DO_GOOGLE,
      audience: env.GOOGLE_CLIENT_IDS,
    }));
  } catch (erro) {
    if (ERROS_DO_TOKEN.some((tipo) => erro instanceof tipo)) {
      throw tokenRecusado();
    }
    throw new AppError(
      'Não foi possível falar com o Google agora. Tente de novo em instantes.',
      503,
      'GOOGLE_INDISPONIVEL',
    );
  }

  const declaracoes = declaracoesDoGoogle.safeParse(payload);
  if (!declaracoes.success) {
    throw tokenRecusado();
  }

  const { sub, email, email_verified, name } = declaracoes.data;
  return {
    sub,
    email: email.toLowerCase(),
    emailVerificado: email_verified === true || email_verified === 'true',
    nome: name?.trim() || undefined,
  };
}
