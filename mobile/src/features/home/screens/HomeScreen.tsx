import { View, Text } from 'react-native';
import { Header } from '@shared/ui/Header';
import { ScreenWrapper } from '@shared/ui/ScreenWrapper';

export default function HomeScreen() {
  return (
    <ScreenWrapper>
      <Header title="Econexa" />
      <View style={{ flex: 1, justifyContent: 'center', paddingTop: 16 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 12, color: '#0f172a' }}>
          Home do Econexa
        </Text>
        <Text style={{ fontSize: 16, color: '#334155' }}>
          Aqui você verá as principais funcionalidades do app.
        </Text>
      </View>
    </ScreenWrapper>
  );
}
