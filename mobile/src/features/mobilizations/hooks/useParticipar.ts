import { useMutation, useQueryClient } from '@tanstack/react-query';
import { participarMobilizacao } from '../api/listar';

export function useParticipar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => participarMobilizacao(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['mobilizacao', id] });
      const prev = qc.getQueryData(['mobilizacao', id]);
      if (prev) {
        qc.setQueryData(['mobilizacao', id], (old: any) => ({
          ...old,
          cont_participantes: (old.cont_participantes ?? 0) + 1,
          usuario_participa: true,
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