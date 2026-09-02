import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sairMobilizacao } from '../api/listar';

export function useSair() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => sairMobilizacao(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['mobilizacao', id] });
      const prev = qc.getQueryData(['mobilizacao', id]);
      if (prev) {
        qc.setQueryData(['mobilizacao', id], (old: any) => ({
          ...old,
          cont_participantes: Math.max(0, (old.cont_participantes ?? 1) - 1),
          usuario_participa: false,
        }));
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['mobilizacao', ctx.prev], ctx.prev);
    },
    onSettled: (_data, _error, id) => {
      qc.invalidateQueries({ queryKey: ['mobilizacao', id] });
    },
  });
}