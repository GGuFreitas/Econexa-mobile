import { useMutation } from '@tanstack/react-query';
import { iniciarSessao } from '@shared/sessao/sessao';
import { entrarComGoogle } from '../api/google';
import { obterIdTokenDoGoogle } from '../helpers/googleSignIn';
import type { AvisoDoGoogle } from '../utils/google';

export type ResultadoDoGoogle = {
  cancelado: boolean;
  aviso: AvisoDoGoogle | null;
};

export function useEntrarComGoogle() {
  return useMutation({
    mutationFn: async (): Promise<ResultadoDoGoogle> => {
      const idToken = await obterIdTokenDoGoogle();
      if (!idToken) return { cancelado: true, aviso: null };

      const resposta = await entrarComGoogle(idToken);
      await iniciarSessao(resposta);
      return { cancelado: false, aviso: resposta.aviso ?? null };
    },
  });
}
