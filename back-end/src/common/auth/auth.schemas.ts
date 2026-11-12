import { z } from 'zod';

const CORPO_INVALIDO = { error: 'Corpo da requisição inválido.' };

const email = z.email('Informe um e-mail válido.').max(255, 'Informe um e-mail válido.');

const senhaNova = z
  .string({ error: 'Informe a senha.' })
  .min(8, 'A senha deve ter ao menos 8 caracteres.')
  .max(128, 'A senha deve ter no máximo 128 caracteres.');

const refreshToken = z
  .string({ error: 'Informe o refresh token.' })
  .min(1, 'Informe o refresh token.')
  .max(512, 'Refresh token inválido.');

export const cadastroSchema = z.object(
  {
    nome: z
      .string({ error: 'Informe o nome completo.' })
      .trim()
      .min(2, 'Informe o nome completo.')
      .max(255, 'O nome deve ter no máximo 255 caracteres.'),
    email,
    password: senhaNova,
  },
  CORPO_INVALIDO,
);

export const loginSchema = z.object(
  {
    email,
    password: z.string({ error: 'Informe a senha.' }).min(1, 'Informe a senha.'),
  },
  CORPO_INVALIDO,
);

export const refreshTokenSchema = z.object({ refreshToken }, CORPO_INVALIDO);

export type CadastroSchema = z.infer<typeof cadastroSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
