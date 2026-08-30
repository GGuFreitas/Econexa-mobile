import { useQuery } from '@tanstack/react-query';
import { buscarMobilizacao } from '../api/listar';

export function useMobilizacao(id: number | null) {
  return useQuery({
    queryKey: ['mobilizacao', id],
    queryFn: () => buscarMobilizacao(id as number),
    enabled: id != null,
  });
}