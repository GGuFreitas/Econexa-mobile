import { ReactNode } from 'react';
import { View } from 'react-native';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';

export function ScreenWrapper({ children }: { children: ReactNode }) {
  const theme = useAppTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: spacing.four }}>
      {children}
    </View>
  );
}
