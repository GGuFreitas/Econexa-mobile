import { z } from 'zod';

export const criarComentarioSchema = z.object({
  conteudo: z.string().trim().min(1, 'Escreva um comentário.').max(1000, 'Comentário muito longo.'),
});

export const listarComentariosQuerySchema = z.object({
  pagina: z.coerce.number().int().positive().optional(),
  limite: z.coerce.number().int().positive().max(50).optional(),
});

export type CriarComentarioBody = z.infer<typeof criarComentarioSchema>;
export type ListarComentariosQueryParams = z.infer<typeof listarComentariosQuerySchema>;
