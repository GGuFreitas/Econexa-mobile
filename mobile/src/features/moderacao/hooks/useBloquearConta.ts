import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bloquearConta } from '../api/bloquearConta';
import { CHAVE_DA_FILA } from './chaves';

export function useBloquearConta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ usuarioId, motivo }: { usuarioId: number; motivo: string }) =>
      bloquearConta(usuarioId, motivo),
    onSuccess: () => qc.invalidateQueries({ queryKey: CHAVE_DA_FILA }),
  });
}
