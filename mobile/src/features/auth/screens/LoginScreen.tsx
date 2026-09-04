import { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLogin } from '@features/auth/hooks/useLogin';
import { LoginForm, type LoginFormValues } from '@features/auth/components/LoginForm';
import { Button } from '@shared/ui/Button';
import { ScreenWrapper } from '@shared/ui/ScreenWrapper';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { mensagemDeErro } from '@shared/utils/mensagemDeErro';
import type { RootStackParamList } from '@navigation/AppNavigator';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const theme = useAppTheme();
  const loginMutation = useLogin();
  const [falha, setFalha] = useState<string | null>(null);

  const handleLogin = useCallback(
    async (dados: LoginFormValues) => {
      setFalha(null);
      try {
        await loginMutation.mutateAsync(dados);
        navigation.navigate('Main');
      } catch (erro) {
        setFalha(mensagemDeErro(erro, 'Falha ao autenticar. Tente novamente.'));
      }
    },
    [loginMutation, navigation],
  );

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Text style={[styles.titulo, { color: theme.colors.onSurface }]}>
          Bem-vindo ao Econexa
        </Text>
        {falha && <Text style={[styles.falha, { color: theme.colors.error }]}>{falha}</Text>}
        <LoginForm onSubmit={handleLogin} />
        <View style={styles.rodape}>
          <Text style={[styles.convite, { color: theme.colors.onSurfaceVariant }]}>
            Ainda não tem conta?
          </Text>
          <Button mode="text" onPress={() => navigation.navigate('Cadastro')}>
            Criar conta
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', paddingVertical: spacing.four, gap: spacing.three },
  titulo: { fontSize: typography.fontSize.title, fontWeight: '700' },
  falha: { fontSize: typography.fontSize.sm },
  rodape: { alignItems: 'center', gap: spacing.one },
  convite: { fontSize: typography.fontSize.sm },
});
