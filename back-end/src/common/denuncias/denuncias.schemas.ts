import { z } from 'zod';

export const criarDenunciaSchema = z.object({
  motivo: z.enum(['spam', 'conteudo_inadequado', 'duplicado', 'outro'], {
    message: 'Motivo inválido.',
  }),
});

export type CriarDenunciaBody = z.infer<typeof criarDenunciaSchema>;
