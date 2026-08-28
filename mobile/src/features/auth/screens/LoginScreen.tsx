import { useCallback } from 'react';
import { View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLogin } from '@features/auth/hooks/useLogin';
import { LoginForm } from '@features/auth/components/LoginForm';
import { ScreenWrapper } from '@shared/ui/ScreenWrapper';
import type { RootStackParamList } from '@navigation/AppNavigator';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const loginMutation = useLogin();

  const handleLogin = useCallback(
    async (data: { email: string; password: string }) => {
      try {
        await loginMutation.mutateAsync(data);
        navigation.navigate('Home');
      } catch (error) {
        console.error('Erro ao logar', error);
      }
    },
    [loginMutation, navigation],
  );

  return (
    <ScreenWrapper>
      <View style={{ justifyContent: 'center', paddingVertical: 24 }}>
        <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 24, color: '#0f172a' }}>
          Bem-vindo ao Econexa
        </Text>
        {loginMutation.isError && (
          <Text style={{ color: '#b91c1c', marginBottom: 16 }}>
            Falha ao autenticar. Verifique suas credenciais.
          </Text>
        )}
        <LoginForm onSubmit={handleLogin} />
      </View>
    </ScreenWrapper>
  );
}
