import { useMutation, useQueryClient } from '@tanstack/react-query';
import { alterarStatusProblema } from '@features/problemas/api/alterarStatus';
import { CHAVE_DA_FILA } from './chaves';

export function useRemoverProblema() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (problemaId: number) => alterarStatusProblema(problemaId, 'removido'),
    onSuccess: (_problema, problemaId) => {
      qc.invalidateQueries({ queryKey: CHAVE_DA_FILA });
      qc.invalidateQueries({ queryKey: ['problema', problemaId] });
      qc.invalidateQueries({ queryKey: ['problemas'] });
      qc.invalidateQueries({ queryKey: ['estatisticas'] });
    },
  });
}
