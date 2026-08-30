import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { Button } from './Button';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const theme = useAppTheme();
  return (
    <View style={styles.center}>
      <Text style={[styles.icon, { color: theme.colors.error }]}>⚠️</Text>
      <Text style={[styles.message, { color: theme.colors.text }]}>{message}</Text>
      {onRetry && (
        <View style={styles.action}>
          <Button mode="outlined" onPress={onRetry}>
            Tentar novamente
          </Button>
        </View>
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
  message: { fontSize: typography.fontSize.base, textAlign: 'center', maxWidth: 300 },
  action: { marginTop: spacing.two },
});
