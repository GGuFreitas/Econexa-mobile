import { useMutation, useQueryClient } from '@tanstack/react-query';
import { desbloquearConta } from '../api/desbloquearConta';
import { CHAVE_DA_FILA } from './chaves';

export function useDesbloquearConta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (usuarioId: number) => desbloquearConta(usuarioId),
    onSuccess: () => qc.invalidateQueries({ queryKey: CHAVE_DA_FILA }),
  });
}
