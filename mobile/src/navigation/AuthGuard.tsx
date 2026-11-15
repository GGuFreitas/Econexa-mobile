import { ReactNode } from 'react';
import { useAppSelector } from '@store/hooks';
import LoginScreen from '@features/auth/screens/LoginScreen';

export function AuthGuard({ children }: { children: ReactNode }) {
  const autenticado = useAppSelector((state) => state.auth.situacao === 'autenticado');

  if (!autenticado) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
