import { z } from 'zod';

export const SENHA_MINIMA = 8;
export const SENHA_MAXIMA = 128;

export const emailSchema = z.string().trim().email('Digite um email válido');

export const novaSenhaSchema = z
  .string()
  .min(SENHA_MINIMA, `A senha precisa ter ao menos ${SENHA_MINIMA} caracteres`)
  .max(SENHA_MAXIMA, `A senha pode ter no máximo ${SENHA_MAXIMA} caracteres`);
