import { useMutation, useQueryClient } from '@tanstack/react-query';
import { criarProblema } from '../api/criar';
import type { CriarProblemaPayload } from '../types';

export function useCriarProblema() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CriarProblemaPayload) => criarProblema(payload),
    onSuccess: (resultado) => {
      qc.invalidateQueries({ queryKey: ['problemas'] });
      qc.invalidateQueries({ queryKey: ['estatisticas'] });
      if (!resultado.criado) {
        qc.invalidateQueries({ queryKey: ['problema', resultado.problema.id] });
      }
    },
  });
}
