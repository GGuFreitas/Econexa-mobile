import { useMutation } from '@tanstack/react-query';
import { reenviarVerificacao } from '../api/verificacaoEmail';

export function useReenviarVerificacao() {
  return useMutation({ mutationFn: () => reenviarVerificacao() });
}
