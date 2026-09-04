import { z } from 'zod';

export const listImagensParamsSchema = z.object({
  tipo_entidade: z.string(),
  entidade_id: z.coerce.number().int().positive(),
});
