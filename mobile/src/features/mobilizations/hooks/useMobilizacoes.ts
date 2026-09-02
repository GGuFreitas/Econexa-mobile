import { useInfiniteQuery } from '@tanstack/react-query';
import { listarMobilizacoes } from '../api/listar';
import type { MobilizacaoQuery } from '../types';

export function useMobilizacoes(query: MobilizacaoQuery) {
  return useInfiniteQuery({
    queryKey: ['mobilizacoes', query],
    queryFn: ({ pageParam = 1 }) => listarMobilizacoes({ ...query, pagina: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < (query.limite ?? 20)) return undefined;
      return allPages.length + 1;
    },
    staleTime: 30_000,
  });
}