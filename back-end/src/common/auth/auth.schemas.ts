import { z } from 'zod';

export const registerSchema = z.object({
  nome: z.string().min(2, 'Informe o nome completo.'),
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter ao menos 6 caracteres.'),
  role: z.enum(['citizen', 'specialist', 'organization']).optional(),
});

export const loginSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter ao menos 6 caracteres.'),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
