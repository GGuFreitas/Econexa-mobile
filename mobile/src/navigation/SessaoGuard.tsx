import { ReactNode } from 'react';
import { useAppSelector } from '@store/hooks';
import { LoadingSpinner } from '@shared/ui/LoadingSpinner';
import { ScreenWrapper } from '@shared/ui/ScreenWrapper';
import SessaoIndisponivelScreen from '@features/auth/screens/SessaoIndisponivelScreen';

export function SessaoGuard({ children }: { children: ReactNode }) {
  const situacao = useAppSelector((state) => state.auth.situacao);

  if (situacao === 'restaurando') {
    return (
      <ScreenWrapper>
        <LoadingSpinner />
      </ScreenWrapper>
    );
  }

  if (situacao === 'erroDeRede') {
    return <SessaoIndisponivelScreen />;
  }

  return <>{children}</>;
}
