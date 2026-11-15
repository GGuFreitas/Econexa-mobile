import { useMutation } from '@tanstack/react-query';
import { iniciarSessao } from '@shared/sessao/sessao';
import { login, type LoginInput } from '../api/login';
import { buildLoginPayload } from '../helpers/buildLoginPayload';

export function useLogin() {
  return useMutation({
    mutationFn: (payload: LoginInput) => login(buildLoginPayload(payload.email, payload.password)),
    onSuccess: (resposta) => iniciarSessao(resposta),
  });
}
