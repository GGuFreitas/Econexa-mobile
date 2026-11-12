import { useMutation } from '@tanstack/react-query';
import { pedirCodigoDeRedefinicao } from '../api/redefinirSenha';
import { normalizarEmail } from '../utils/email';

export function usePedirCodigo() {
  return useMutation({
    mutationFn: (email: string) => pedirCodigoDeRedefinicao(normalizarEmail(email)),
  });
}
