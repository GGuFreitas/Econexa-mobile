import { useMutation, useQueryClient } from '@tanstack/react-query';
import { criarComentario } from '../api/criar';

export function useCriarComentario(problemaId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (conteudo: string) => criarComentario({ problemaId, conteudo }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comentarios', problemaId] });
      qc.invalidateQueries({ queryKey: ['eventos', problemaId] });
    },
  });
}
