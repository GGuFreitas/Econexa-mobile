import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { texto } from '@shared/theme/typography';
import { Button } from './Button';

type Icone = keyof typeof MaterialCommunityIcons.glyphMap;

interface ErrorStateProps {
  /** O que deu errado, em uma frase curta. */
  message: string;
  /** O que a pessoa pode fazer. */
  dica?: string;
  onRetry?: () => void;
  icon?: Icone;
  compacto?: boolean;
}

export function ErrorState({
  message,
  dica,
  onRetry,
  icon = 'wifi-alert',
  compacto = false,
}: ErrorStateProps) {
  const theme = useAppTheme();

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        flex: compacto ? undefined : 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.four,
        paddingVertical: spacing.five,
        gap: spacing.two,
      }}
    >
      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        aria-hidden
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.secondaryContainer,
          marginBottom: spacing.half,
        }}
      >
        <MaterialCommunityIcons name={icon} size={30} color={theme.colors.onSecondaryContainer} />
      </View>
      <Text style={{ ...texto.tituloSecao, color: theme.colors.onSurface, textAlign: 'center', maxWidth: 300 }}>
        {message}
      </Text>
      {dica && (
        <Text style={{ ...texto.corpo, color: theme.colors.onSurfaceVariant, textAlign: 'center', maxWidth: 300 }}>
          {dica}
        </Text>
      )}
      {onRetry && (
        <Button mode="outlined" icon="refresh" onPress={onRetry} style={{ marginTop: spacing.two }}>
          Tentar de novo
        </Button>
      )}
    </View>
  );
}
