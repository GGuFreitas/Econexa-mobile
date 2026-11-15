import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { recarregarUsuario } from '../helpers/recarregarUsuario';

export function useReleituraDoUsuario(ativo: boolean) {
  useEffect(() => {
    if (!ativo) return undefined;

    let anterior: AppStateStatus = AppState.currentState;
    const assinatura = AppState.addEventListener('change', (proximo) => {
      const voltou = anterior !== 'active' && proximo === 'active';
      anterior = proximo;
      if (voltou) recarregarUsuario().catch(() => undefined);
    });

    return () => assinatura.remove();
  }, [ativo]);
}
