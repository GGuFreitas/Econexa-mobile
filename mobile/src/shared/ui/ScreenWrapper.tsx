import { ReactNode } from 'react';
import { View } from 'react-native';

export function ScreenWrapper({ children }: { children: ReactNode }) {
  return <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 16 }}>{children}</View>;
}
