import { z } from 'zod';

export const criarEventoSchema = z.object({
  titulo: z.string().min(3, 'Título muito curto.').max(120),
  descricao: z.string().max(2000).optional(),
  causaId: z.number().int().positive('Informe a causa.'),
  tipo: z.enum(['mutirao', 'encontro', 'outro']).default('mutirao'),
  lat: z.number().min(-33.75).max(5.27).optional(),
  lng: z.number().min(-73.99).max(-34.79).optional(),
  dataInicio: z.string().min(1, 'Informe a data de início.'),
  dataFim: z.string().optional(),
});

export const listarEventosQuerySchema = z.object({
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  raio: z.coerce.number().positive().optional(),
  causaId: z.coerce.number().int().positive().optional(),
  status: z.string().optional(),
  tipo: z.string().optional(),
  limite: z.coerce.number().int().positive().max(50).optional(),
  pagina: z.coerce.number().int().positive().optional(),
});

export const vincularProblemaSchema = z.object({
  resolveu: z.boolean().optional(),
});

export type CriarEventoBody = z.infer<typeof criarEventoSchema>;
