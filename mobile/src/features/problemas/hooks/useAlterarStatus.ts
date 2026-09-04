import { useMutation, useQueryClient } from '@tanstack/react-query';
import { alterarStatusProblema } from '../api/alterarStatus';
import type { ProblemaStatus } from '../types';

export function useAlterarStatus(problemaId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (status: ProblemaStatus) => alterarStatusProblema(problemaId, status),
    onSuccess: (problema) => {
      qc.setQueryData(['problema', problemaId], problema);
      qc.invalidateQueries({ queryKey: ['eventos', problemaId] });
      qc.invalidateQueries({ queryKey: ['problemas'] });
      qc.invalidateQueries({ queryKey: ['estatisticas'] });
    },
  });
}
