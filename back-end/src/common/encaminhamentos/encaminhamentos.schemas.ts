import { z } from 'zod';

export const criarEncaminhamentoSchema = z.object({
  orgaoId: z.number().int().positive('Escolha o órgão responsável.'),
  mensagem: z.string().trim().max(2000, 'Mensagem muito longa.').optional(),
});

export const registrarRespostaSchema = z.object({
  resposta: z
    .string()
    .trim()
    .min(5, 'Descreva a resposta do órgão.')
    .max(4000, 'Resposta muito longa.'),
  protocolo: z.string().trim().max(60).optional(),
});

export type CriarEncaminhamentoBody = z.infer<typeof criarEncaminhamentoSchema>;
export type RegistrarRespostaBody = z.infer<typeof registrarRespostaSchema>;
