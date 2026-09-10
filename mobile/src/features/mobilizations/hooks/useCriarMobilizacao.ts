import { useMutation, useQueryClient } from '@tanstack/react-query';
import { criarMobilizacao } from '../api/listar';
import type { CriarMobilizacaoInput } from '../types';

export function useCriarMobilizacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CriarMobilizacaoInput) => criarMobilizacao(input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['mobilizacoes', { problemaId: data.problema_id }] });
      qc.invalidateQueries({ queryKey: ['eventos', data.problema_id] });
    },
  });
}