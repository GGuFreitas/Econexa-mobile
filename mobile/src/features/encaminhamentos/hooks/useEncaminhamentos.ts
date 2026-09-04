import { useQuery } from '@tanstack/react-query';
import { listarEncaminhamentos } from '../api/listar';
import type { Encaminhamento } from '../types';

export function useEncaminhamentos(problemaId: number | null) {
  return useQuery<Encaminhamento[]>({
    queryKey: ['encaminhamentos', problemaId],
    queryFn: () => listarEncaminhamentos(problemaId as number),
    enabled: problemaId != null,
    staleTime: 30_000,
  });
}
