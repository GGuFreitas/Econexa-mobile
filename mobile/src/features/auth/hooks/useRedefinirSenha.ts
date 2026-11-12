import { useMutation } from '@tanstack/react-query';
import { iniciarSessao } from '@shared/sessao/sessao';
import { redefinirSenha, type RedefinirSenhaInput } from '../api/redefinirSenha';
import { normalizarEmail } from '../utils/email';

export function useRedefinirSenha() {
  return useMutation({
    mutationFn: (payload: RedefinirSenhaInput) =>
      redefinirSenha({
        email: normalizarEmail(payload.email),
        code: payload.code.trim(),
        password: payload.password,
      }),
    onSuccess: (sessao) => iniciarSessao(sessao),
  });
}
