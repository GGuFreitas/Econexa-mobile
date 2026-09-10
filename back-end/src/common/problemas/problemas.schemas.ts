import { z } from 'zod';

// Contexto Brasil: mantém o mapa dentro das fronteiras nacionais.
export const BRASIL_BBOX = { minLat: -33.75, maxLat: 5.27, minLng: -73.99, maxLng: -34.79 };

export const criarProblemaSchema = z.object({
  titulo: z.string().min(3, 'Informe um título com ao menos 3 caracteres.').max(120),
  descricao: z.string().max(2000).optional(),
  causaId: z.number().int().positive('Informe a causa.'),
  tags: z.array(z.string().min(1).max(30)).max(10, 'Máximo de 10 tags.').optional(),
  tipo: z.enum(['problema', 'ponto_positivo', 'cultural']).default('problema'),
  lat: z.number().min(BRASIL_BBOX.minLat).max(BRASIL_BBOX.maxLat, 'Coordenada fora do Brasil.'),
  lng: z.number().min(BRASIL_BBOX.minLng).max(BRASIL_BBOX.maxLng, 'Coordenada fora do Brasil.'),
  localNome: z.string().max(120).optional(),
  escopo: z.enum(['local', 'municipal', 'estadual', 'nacional']).default('local'),
});

export const listarProblemasQuerySchema = z.object({
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  raio: z.coerce.number().int().positive().max(50000).default(5000),
  causaId: z.coerce.number().int().positive().optional(),
  tags: z
    .union([z.array(z.string()), z.string().transform((value) => [value])])
    .optional(),
  tipo: z.enum(['problema', 'ponto_positivo', 'cultural']).optional(),
  status: z.enum(['ativo', 'em_analise', 'encaminhado', 'resolvido', 'removido']).optional(),
  escopo: z.enum(['local', 'municipal', 'estadual', 'nacional']).optional(),
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(100).default(20),
});

export type CriarProblemaSchema = z.infer<typeof criarProblemaSchema>;
export const alterarStatusProblemaSchema = z.object({
  status: z.enum(['ativo', 'em_analise', 'encaminhado', 'resolvido', 'removido']),
});

export type ListarProblemasQuerySchema = z.infer<typeof listarProblemasQuerySchema>;
export type AlterarStatusProblemaSchema = z.infer<typeof alterarStatusProblemaSchema>;
