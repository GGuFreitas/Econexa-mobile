import { useMutation, useQueryClient } from '@tanstack/react-query';
import { descartarDenuncias } from '../api/descartarDenuncias';
import { CHAVE_DA_FILA } from './chaves';

export function useDescartarDenuncias() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (problemaId: number) => descartarDenuncias(problemaId),
    onSuccess: () => qc.invalidateQueries({ queryKey: CHAVE_DA_FILA }),
  });
}
