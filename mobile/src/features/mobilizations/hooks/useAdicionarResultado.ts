import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adicionarResultadoMobilizacao } from '../api/listar';

export function useAdicionarResultado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number;
      input: { descricao: string; metricas?: Record<string, number>; imagens?: string[] };
    }) => adicionarResultadoMobilizacao(id, input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['mobilizacoes', { problemaId: data.problema_id }] });
      qc.invalidateQueries({ queryKey: ['mobilizacao', data.id] });
      qc.invalidateQueries({ queryKey: ['eventos', data.problema_id] });
    },
  });
}