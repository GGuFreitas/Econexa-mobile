import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';

interface ScreenWrapperProps {
  children: ReactNode;
  /** Barra de topo (Header). Fica de ponta a ponta e cuida da área segura. */
  cabecalho?: ReactNode;
  /**
   * Respiro lateral de 16 no conteúdo. Desligue quando a tela controla o próprio
   * respiro (listas, rolagens com conteúdo de ponta a ponta).
   */
  respiro?: boolean;
  /** Aplica a área segura de baixo (telas fora das abas). */
  baseSegura?: boolean;
}

export function ScreenWrapper({ children, cabecalho, respiro = true, baseSegura = false }: ScreenWrapperProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const topo = cabecalho ? 0 : insets.top + spacing.two;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {cabecalho}
      <View
        style={{
          flex: 1,
          paddingTop: respiro ? topo + spacing.three : topo,
          paddingHorizontal: respiro ? spacing.three : 0,
          paddingBottom: baseSegura ? insets.bottom : 0,
        }}
      >
        {children}
      </View>
    </View>
  );
}
