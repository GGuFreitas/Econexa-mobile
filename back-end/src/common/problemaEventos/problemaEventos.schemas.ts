import { z } from 'zod';

export const listarEventosQuerySchema = z.object({
  pagina: z.coerce.number().int().positive().optional(),
  limite: z.coerce.number().int().positive().max(50).optional(),
});

export type ListarEventosQueryParams = z.infer<typeof listarEventosQuerySchema>;
