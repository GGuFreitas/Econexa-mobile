import { useMutation, useQueryClient } from '@tanstack/react-query';
import { atualizarStatusMobilizacao } from '../api/listar';

export function useAtualizarStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: 'agendada' | 'em_andamento' | 'realizada' | 'cancelada';
    }) => atualizarStatusMobilizacao(id, status),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['mobilizacoes', { problemaId: data.problema_id }] });
      qc.invalidateQueries({ queryKey: ['mobilizacao', data.id] });
      qc.invalidateQueries({ queryKey: ['eventos', data.problema_id] });
    },
  });
}