import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
}

export function EmptyState({ icon = 'map-marker-off', title, description }: EmptyStateProps) {
  const theme = useAppTheme();
  return (
    <View style={styles.center}>
      <Text style={[styles.icon, { color: theme.colors.textTertiary }]}>📍</Text>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      {description && (
        <Text style={[styles.desc, { color: theme.colors.textSecondary }]}>{description}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.four,
    gap: spacing.two,
  },
  icon: { fontSize: 40 },
  title: { fontSize: typography.fontSize.lg, fontWeight: '700', textAlign: 'center' },
  desc: { fontSize: typography.fontSize.sm, textAlign: 'center', maxWidth: 280 },
});
