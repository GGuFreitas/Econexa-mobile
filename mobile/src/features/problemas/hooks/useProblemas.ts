import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listarProblemas } from '../api/listar';
import type { ProblemaQuery } from '../types';

export function useProblemas(query: ProblemaQuery = {}, enabled = true) {
  return useQuery({
    queryKey: ['problemas', query],
    queryFn: () => listarProblemas(query),
    staleTime: 30_000,
    enabled,
    placeholderData: keepPreviousData,
  });
}
