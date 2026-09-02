import { useMutation, useQueryClient } from '@tanstack/react-query';
import { atualizarMobilizacao } from '../api/listar';
import type { AtualizarMobilizacaoInput } from '../types';

export function useAtualizarMobilizacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: AtualizarMobilizacaoInput }) =>
      atualizarMobilizacao(id, input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['mobilizacoes', { problemaId: data.problema_id }] });
      qc.invalidateQueries({ queryKey: ['mobilizacao', data.id] });
    },
  });
}