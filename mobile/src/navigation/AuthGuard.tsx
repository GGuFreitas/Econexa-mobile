import { ReactNode } from 'react';
import { useAppSelector } from '@store/hooks';
import LoginScreen from '@features/auth/screens/LoginScreen';

export function AuthGuard({ children }: { children: ReactNode }) {
  const token = useAppSelector((state) => state.auth.token);

  if (!token) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
