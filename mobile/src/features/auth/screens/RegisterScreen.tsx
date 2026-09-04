import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRegister } from '@features/auth/hooks/useRegister';
import { useLogin } from '@features/auth/hooks/useLogin';
import { RegisterForm, type RegisterFormValues } from '@features/auth/components/RegisterForm';
import { Header } from '@shared/ui/Header';
import { ScreenWrapper } from '@shared/ui/ScreenWrapper';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { mensagemDeErro } from '@shared/utils/mensagemDeErro';
import type { RootStackParamList } from '@navigation/AppNavigator';

type RegisterScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function RegisterScreen() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const theme = useAppTheme();
  const registerMutation = useRegister();
  const loginMutation = useLogin();
  const [falha, setFalha] = useState<string | null>(null);

  const handleRegister = useCallback(
    async (dados: RegisterFormValues) => {
      setFalha(null);
      try {
        await registerMutation.mutateAsync({
          nome: dados.nome,
          email: dados.email,
          password: dados.password,
        });
      } catch (erro) {
        setFalha(mensagemDeErro(erro, 'Não foi possível criar a conta. Tente novamente.'));
        return;
      }

      try {
        await loginMutation.mutateAsync({ email: dados.email, password: dados.password });
        navigation.navigate('Main');
      } catch {
        setFalha('Conta criada. Entre com seu e-mail e senha para continuar.');
        navigation.goBack();
      }
    },
    [registerMutation, loginMutation, navigation],
  );

  return (
    <ScreenWrapper>
      <Header title="Criar conta" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.convite, { color: theme.colors.onSurfaceVariant }]}>
          Sua conta nasce como cidadão. É ela que permite relatar problemas, apoiar e organizar
          mobilizações.
        </Text>
        {falha && <Text style={[styles.falha, { color: theme.colors.error }]}>{falha}</Text>}
        <RegisterForm onSubmit={handleRegister} submitting={loginMutation.isPending} />
      </ScrollView>
      <View />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: spacing.three, gap: spacing.three },
  convite: { fontSize: typography.fontSize.sm, lineHeight: 20 },
  falha: { fontSize: typography.fontSize.sm },
});
