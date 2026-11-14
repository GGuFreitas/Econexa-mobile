import { useMutation } from '@tanstack/react-query';
import { encerrarSessaoLocalmente } from '@shared/sessao/sessao';
import { excluirConta, type ExclusaoDeContaInput } from '../api/excluirConta';

export function useExcluirConta() {
  return useMutation({
    mutationFn: (payload: ExclusaoDeContaInput) => excluirConta(payload),
    onSuccess: () => encerrarSessaoLocalmente(),
  });
}
