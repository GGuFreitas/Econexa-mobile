import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reenviarEncaminhamento } from '../api/reenviar';

export function useReenviarEncaminhamento(problemaId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (encaminhamentoId: number) =>
      reenviarEncaminhamento(problemaId, encaminhamentoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['encaminhamentos', problemaId] });
    },
  });
}
