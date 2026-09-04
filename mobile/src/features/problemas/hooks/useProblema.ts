import { useQuery } from '@tanstack/react-query';
import { buscarProblema } from '../api/buscar';
import type { ProblemaDetalhe } from '../types';

export function useProblema(id: number | null) {
  return useQuery<ProblemaDetalhe>({
    queryKey: ['problema', id],
    queryFn: () => buscarProblema(id as number),
    enabled: id != null,
  });
}
