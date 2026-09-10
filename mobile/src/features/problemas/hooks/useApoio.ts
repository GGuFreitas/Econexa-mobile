import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apoiarProblema, desapoiarProblema } from '../api/apoios';
import type { Problema } from '../types';

export function useApoio(problemaId: number) {
  const qc = useQueryClient();

  const otimista = (delta: number) => async () => {
    await qc.cancelQueries({ queryKey: ['problema', problemaId] });
    const prev = qc.getQueryData<Problema>(['problema', problemaId]);
    if (prev) {
      qc.setQueryData<Problema>(['problema', problemaId], {
        ...prev,
        cont_apoios: Math.max(0, prev.cont_apoios + delta),
      });
    }
    return { prev };
  };

  const reverter = (ctx: { prev?: Problema } | undefined) => {
    if (ctx?.prev) qc.setQueryData(['problema', problemaId], ctx.prev);
  };

  const apoiar = useMutation({
    mutationFn: () => apoiarProblema(problemaId),
    onMutate: otimista(1),
    onError: (_e, _v, ctx) => reverter(ctx),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['problemas'] });
      qc.invalidateQueries({ queryKey: ['problema', problemaId] });
      qc.invalidateQueries({ queryKey: ['estatisticas'] });
      qc.invalidateQueries({ queryKey: ['eventos', problemaId] });
    },
  });

  const desapoiar = useMutation({
    mutationFn: () => desapoiarProblema(problemaId),
    onMutate: otimista(-1),
    onError: (_e, _v, ctx) => reverter(ctx),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['problemas'] });
      qc.invalidateQueries({ queryKey: ['problema', problemaId] });
      qc.invalidateQueries({ queryKey: ['estatisticas'] });
      qc.invalidateQueries({ queryKey: ['eventos', problemaId] });
    },
  });

  return { apoiar, desapoiar };
}
