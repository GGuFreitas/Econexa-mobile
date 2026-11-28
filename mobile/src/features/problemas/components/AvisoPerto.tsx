import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { texto } from '@shared/theme/typography';
import { rotuloProblemas } from '../utils/proximidade';

interface AvisoPertoProps {
  /** Total perto de você; `null` enquanto não há localização. */
  total: number | null;
  raioKm: number;
  /** Ainda procurando o GPS. */
  localizando: boolean;
}

/**
 * Topo do Feed: diz o que a pessoa está vendo. Com localização, abre com
 * "Perto de você agora"; sem ela, avisa e mostra os mais recentes.
 */
export function AvisoPerto({ total, raioKm, localizando }: AvisoPertoProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const temLocal = total !== null;

  const titulo = temLocal ? 'Perto de você agora' : 'Problemas na cidade';
  const resumo = temLocal
    ? `${rotuloProblemas(total)} em até ${raioKm} km, do mais perto ao mais longe`
    : localizando
      ? 'Procurando sua localização…'
      : 'Sem sua localização, mostramos os mais recentes. Ative a localização para ver o que está perto.';
  const icone = temLocal ? 'crosshairs-gps' : localizando ? 'crosshairs' : 'crosshairs-off';

  return (
    <View
      style={{
        paddingTop: insets.top + spacing.three,
        paddingHorizontal: spacing.three,
        paddingBottom: spacing.one,
        gap: spacing.half,
      }}
    >
      <Text accessibilityRole="header" style={{ ...texto.titulo, color: theme.colors.onSurface }}>
        {titulo}
      </Text>
      <View
        accessibilityLiveRegion="polite"
        style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.one }}
      >
        <MaterialCommunityIcons
          name={icone}
          size={18}
          color={temLocal ? theme.colors.primary : theme.colors.onSurfaceVariant}
          style={{ marginTop: 1 }}
        />
        <Text style={{ ...texto.meta, flex: 1, color: theme.colors.onSurfaceVariant }}>{resumo}</Text>
      </View>
    </View>
  );
}
