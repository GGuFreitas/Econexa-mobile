import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { texto } from '@shared/theme/typography';
import { mapShadow } from './mapTheme';
import { rotuloProblemas } from '../utils/proximidade';

interface PertoDeVoceProps {
  total: number;
  raioKm: number;
  top?: number;
}

export function PertoDeVoce({ total, raioKm, top = 64 }: PertoDeVoceProps) {
  const theme = useAppTheme();

  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`Perto de você: ${rotuloProblemas(total)} em até ${raioKm} quilômetros`}
      style={[styles.card, mapShadow, { top, backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow }]}
    >
      <MaterialCommunityIcons name="crosshairs-gps" size={18} color={theme.colors.primary} />
      <Text style={[styles.texto, { color: theme.colors.onSurface }]}>
        <Text style={styles.forte}>{rotuloProblemas(total)}</Text> perto de você
      </Text>
      <Text style={[styles.meta, { color: theme.colors.onSurfaceVariant }]}>· {raioKm} km</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.one,
    paddingVertical: spacing.one,
    paddingHorizontal: spacing.three,
    borderRadius: 99,
  },
  texto: { ...texto.meta, fontSize: 14 },
  forte: { fontWeight: '700' },
  meta: { ...texto.meta },
});
