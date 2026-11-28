import { View, ActivityIndicator, Text } from 'react-native';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { texto } from '@shared/theme/typography';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  /** Texto curto do que está carregando (ex.: "Carregando o feed"). */
  mensagem?: string;
}

export function LoadingSpinner({ size = 'large', mensagem }: LoadingSpinnerProps) {
  const theme = useAppTheme();
  const pequeno = size === 'small';

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={mensagem ?? 'Carregando'}
      style={{
        flex: pequeno ? undefined : 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: pequeno ? spacing.three : spacing.four,
        gap: spacing.two,
      }}
    >
      <ActivityIndicator size={size} color={theme.colors.primary} />
      {mensagem && (
        <Text style={{ ...texto.meta, color: theme.colors.onSurfaceVariant }}>{mensagem}</Text>
      )}
    </View>
  );
}
