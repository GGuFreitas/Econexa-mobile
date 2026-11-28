import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { texto } from '@shared/theme/typography';
import { Button } from './Button';

type Icone = keyof typeof MaterialCommunityIcons.glyphMap;

interface EmptyStateProps {
  icon?: Icone;
  title: string;
  description?: string;
  /** Ação que resolve o vazio (ex.: "Relatar problema"). */
  acaoRotulo?: string;
  acaoIcone?: string;
  onAcao?: () => void;
  /** Ocupa a tela toda (padrão) ou só o espaço do conteúdo. */
  compacto?: boolean;
}

export function EmptyState({
  icon = 'map-marker-outline',
  title,
  description,
  acaoRotulo,
  acaoIcone,
  onAcao,
  compacto = false,
}: EmptyStateProps) {
  const theme = useAppTheme();
  const temAcao = Boolean(acaoRotulo && onAcao);

  return (
    <View
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
          backgroundColor: theme.colors.primaryContainer,
          marginBottom: spacing.half,
        }}
      >
        <MaterialCommunityIcons name={icon} size={30} color={theme.colors.onPrimaryContainer} />
      </View>
      <Text
        accessibilityRole="header"
        style={{ ...texto.tituloSecao, color: theme.colors.onSurface, textAlign: 'center' }}
      >
        {title}
      </Text>
      {description && (
        <Text
          style={{
            ...texto.corpo,
            color: theme.colors.onSurfaceVariant,
            textAlign: 'center',
            maxWidth: 300,
          }}
        >
          {description}
        </Text>
      )}
      {temAcao && (
        <Button mode="contained" icon={acaoIcone} onPress={onAcao} style={{ marginTop: spacing.two }}>
          {acaoRotulo}
        </Button>
      )}
    </View>
  );
}
