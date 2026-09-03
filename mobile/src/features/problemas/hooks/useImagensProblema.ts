import { useQuery } from '@tanstack/react-query';
import { listarImagensProblema } from '../api/listarImagens';
import type { ImagemProblema } from '../types';

export function useImagensProblema(problemaId: number | null) {
  return useQuery<ImagemProblema[]>({
    queryKey: ['imagens', 'problema', problemaId],
    queryFn: () => listarImagensProblema(problemaId as number),
    enabled: problemaId != null,
    staleTime: 30_000,
  });
}
