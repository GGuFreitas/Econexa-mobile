import { useMutation, useQueryClient } from '@tanstack/react-query';
import { criarEncaminhamento } from '../api/criar';
import type { CriarEncaminhamentoPayload } from '../types';

export function useCriarEncaminhamento(problemaId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CriarEncaminhamentoPayload) =>
      criarEncaminhamento(problemaId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['encaminhamentos', problemaId] });
      qc.invalidateQueries({ queryKey: ['eventos', problemaId] });
      qc.invalidateQueries({ queryKey: ['problema', problemaId] });
    },
  });
}
