import { useMutation } from '@tanstack/react-query';
import { iniciarSessao } from '@shared/sessao/sessao';
import { register, type RegisterInput } from '../api/register';
import { normalizarEmail } from '../utils/email';

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterInput) =>
      register({
        nome: payload.nome.trim(),
        email: normalizarEmail(payload.email),
        password: payload.password,
      }),
    onSuccess: (resposta) => iniciarSessao(resposta),
  });
}
