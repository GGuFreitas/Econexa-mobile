import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';

export function LoadingSpinner({ size = 'large' }: { size?: 'small' | 'large' }) {
  const theme = useAppTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator size={size} color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.four,
  },
});
