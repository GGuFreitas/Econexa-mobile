import { useQuery } from '@tanstack/react-query';
import { listarComentarios } from '../api/listar';
import type { Comentario } from '../types';

const LIMITE_POR_PROBLEMA = 50;

export function useComentarios(problemaId: number | null) {
  return useQuery<Comentario[]>({
    queryKey: ['comentarios', problemaId],
    queryFn: () =>
      listarComentarios({ problemaId: problemaId as number, limite: LIMITE_POR_PROBLEMA }),
    enabled: problemaId != null,
    staleTime: 30_000,
  });
}
