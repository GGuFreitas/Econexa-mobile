import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';

interface PertoDeVoceProps {
  total: number;
  mobilizando: number;
}

export function PertoDeVoce({ total, mobilizando }: PertoDeVoceProps) {
  const theme = useAppTheme();
  const raioKm = 8;

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
      <MaterialCommunityIcons name="map-marker-radius" size={20} color={theme.colors.primary} />
      <Text style={[styles.title, { color: theme.colors.onSurface }]}>Perto de você</Text>
      <View style={styles.divider} />
      <Text style={[styles.metric, { color: theme.colors.onSurface }]}>{total}</Text>
      <Text style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]}>
        em {raioKm}km
      </Text>
      {mobilizando > 0 && (
        <>
          <View style={styles.divider} />
          <MaterialCommunityIcons name="account-group" size={16} color={theme.colors.secondary} />
          <Text style={[styles.mobilizando, { color: theme.colors.secondary }]}>
            {mobilizando} mobilizando
          </Text>
        </>
      )}
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
  mobilizando: { fontSize: typography.fontSize.xs, fontWeight: '700' },
});
