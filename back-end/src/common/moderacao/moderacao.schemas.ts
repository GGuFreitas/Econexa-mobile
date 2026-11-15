import { z } from 'zod';

export const filaDeDenunciasQuerySchema = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(50).default(20),
});

export const bloqueioSchema = z.object(
  {
    motivo: z
      .string({ error: 'Informe o motivo do bloqueio.' })
      .trim()
      .min(3, 'Informe o motivo do bloqueio.')
      .max(500, 'O motivo deve ter no máximo 500 caracteres.'),
  },
  { error: 'Corpo da requisição inválido.' },
);
