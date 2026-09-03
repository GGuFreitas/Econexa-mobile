import { useMutation, useQueryClient } from '@tanstack/react-query';
import { excluirComentario } from '../api/excluir';

export function useExcluirComentario(problemaId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (comentarioId: number) => excluirComentario({ problemaId, comentarioId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comentarios', problemaId] });
    },
  });
}
