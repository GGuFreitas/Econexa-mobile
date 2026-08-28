import { z } from 'zod';

export const createImagemSchema = z.object({
  tipo_entidade: z.string().min(1, 'Informe o tipo da entidade.'),
  entidade_id: z.number().int().positive('Informe o id da entidade.'),
  url: z.url('Informe uma url válida.'),
  principal: z.boolean().optional(),
  ordem: z.number().int().optional(),
});

export const listImagensParamsSchema = z.object({
  tipo_entidade: z.string(),
  entidade_id: z.coerce.number().int().positive(),
});

export type CreateImagemInput = z.infer<typeof createImagemSchema>;
