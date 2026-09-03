import { useMutation, useQueryClient } from '@tanstack/react-query';
import { registrarResposta } from '../api/registrarResposta';
import type { RegistrarRespostaPayload } from '../types';

export function useRegistrarResposta(problemaId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegistrarRespostaPayload) => registrarResposta(problemaId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['encaminhamentos', problemaId] });
      qc.invalidateQueries({ queryKey: ['eventos', problemaId] });
    },
  });
}
