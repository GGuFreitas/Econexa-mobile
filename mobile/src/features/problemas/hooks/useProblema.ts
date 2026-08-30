import { useQuery } from '@tanstack/react-query';
import { buscarProblema } from '../api/buscar';

export function useProblema(id: number | null) {
  return useQuery({
    queryKey: ['problema', id],
    queryFn: () => buscarProblema(id as number),
    enabled: id != null,
  });
}
