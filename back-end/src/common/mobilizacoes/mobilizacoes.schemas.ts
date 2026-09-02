import { z } from 'zod';

export const criarMobilizacaoSchema = z.object({
  problemaId: z.number().int().positive('Informe o problema.'),
  titulo: z.string().min(3, 'Título muito curto.').max(120),
  descricao: z.string().max(2000).optional(),
  dataInicio: z.string().min(1, 'Informe a data de início.'),
  dataFim: z.string().optional(),
  localNome: z.string().max(160).optional(),
  lat: z.number().min(-33.75).max(5.27).optional(),
  lng: z.number().min(-73.99).max(-34.79).optional(),
});

export const atualizarMobilizacaoSchema = z.object({
  titulo: z.string().min(3).max(120).optional(),
  descricao: z.string().max(2000).optional(),
  dataInicio: z.string().min(1).optional(),
  dataFim: z.string().optional(),
  localNome: z.string().max(160).optional(),
  lat: z.number().min(-33.75).max(5.27).optional(),
  lng: z.number().min(-73.99).max(-34.79).optional(),
});

export const atualizarStatusMobilizacaoSchema = z.object({
  status: z.enum(['agendada', 'em_andamento', 'realizada', 'cancelada']),
});

export const resultadoMobilizacaoSchema = z.object({
  descricao: z.string().min(10, 'Descreva o resultado.').max(2000),
  metricas: z.record(z.string(), z.number()).optional(),
  imagens: z.array(z.string()).max(10).optional(),
});

export const listarMobilizacoesQuerySchema = z.object({
  problemaId: z.coerce.number().int().positive('Informe o problema.'),
  pagina: z.coerce.number().int().positive().optional(),
  limite: z.coerce.number().int().positive().max(50).optional(),
});
