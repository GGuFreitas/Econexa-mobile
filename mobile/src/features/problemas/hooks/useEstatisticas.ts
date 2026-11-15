import { useQuery } from '@tanstack/react-query';
import { obterEstatisticas } from '../api/estatisticas';
import type { ProblemaQuery } from '../types';

export function useEstatisticas(query: ProblemaQuery = {}, enabled = true) {
  return useQuery({
    queryKey: ['estatisticas', query],
    queryFn: () => obterEstatisticas(query),
    staleTime: 30_000,
    enabled,
  });
}
