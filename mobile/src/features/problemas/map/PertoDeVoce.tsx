import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';

interface PertoDeVoceProps {
  total: number;
  raioKm: number;
}

export function PertoDeVoce({ total, raioKm }: PertoDeVoceProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
      <MaterialCommunityIcons name="map-marker-radius" size={20} color={theme.colors.primary} />
      <Text style={[styles.title, { color: theme.colors.onSurface }]}>Perto de você</Text>
      <View style={styles.divider} />
      <Text style={[styles.metric, { color: theme.colors.onSurface }]}>{total}</Text>
      <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
        em {raioKm}km
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    top: 64,
    left: spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.two,
    paddingVertical: spacing.two,
    paddingHorizontal: spacing.three,
    borderRadius: 16,
    borderWidth: 1,
  },
  title: { fontSize: typography.fontSize.sm, fontWeight: '700' },
  divider: { width: 1, height: 20, backgroundColor: '#E2E6EC' },
  metric: { fontSize: typography.fontSize.lg, fontWeight: '800' },
  metricLabel: { fontSize: typography.fontSize.xs },
});
