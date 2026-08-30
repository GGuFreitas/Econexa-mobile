import { useMutation, useQueryClient } from '@tanstack/react-query';
import { criarProblema } from '../api/criar';
import type { CriarProblemaPayload, Problema } from '../types';

export function useCriarProblema() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CriarProblemaPayload) => criarProblema(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['problemas'] });
      qc.invalidateQueries({ queryKey: ['estatisticas'] });
    },
  });
}
