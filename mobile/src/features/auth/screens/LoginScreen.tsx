import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLogin } from '@features/auth/hooks/useLogin';
import { LoginForm, type LoginFormValues } from '@features/auth/components/LoginForm';
import { BotaoGoogle } from '@features/auth/components/BotaoGoogle';
import { MarcaMutira } from '@features/auth/components/MarcaMutira';
import { MensagemDeRetorno } from '@features/auth/components/MensagemDeRetorno';
import { Button } from '@shared/ui/Button';
import { ScreenWrapper } from '@shared/ui/ScreenWrapper';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { mensagemDeErro, mensagemDoCodigo } from '@shared/utils/mensagemDeErro';
import { useAppSelector } from '@store/hooks';
import type { RootStackParamList } from '@navigation/AppNavigator';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const theme = useAppTheme();
  const loginMutation = useLogin();
  const motivoDoEncerramento = useAppSelector((state) => state.auth.motivoDoEncerramento);
  const [falha, setFalha] = useState<string | null>(null);

  const mensagem = falha ?? mensagemDoCodigo(motivoDoEncerramento);

  const handleLogin = async (dados: LoginFormValues) => {
    setFalha(null);
    try {
      await loginMutation.mutateAsync(dados);
      navigation.navigate('Main');
    } catch (erro) {
      setFalha(mensagemDeErro(erro, 'Falha ao autenticar. Tente novamente.'));
    }
  };
  const handleEntrouComGoogle = () => navigation.navigate('Main');
  const handleEsqueciSenha = () => navigation.navigate('EsqueciSenha');
  const handleCriarConta = () => navigation.navigate('Cadastro');

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <MarcaMutira />
        <MensagemDeRetorno texto={mensagem} />
        <LoginForm onSubmit={handleLogin} />
        <Button mode="text" onPress={handleEsqueciSenha}>
          Esqueci minha senha
        </Button>
        <BotaoGoogle onEntrou={handleEntrouComGoogle} onFalha={setFalha} />
        <View style={styles.rodape}>
          <Text style={[styles.convite, { color: theme.colors.onSurfaceVariant }]}>
            Ainda não tem conta?
          </Text>
          <Button mode="text" onPress={handleCriarConta}>
            Criar conta
          </Button>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: spacing.four,
    gap: spacing.three,
  },
  rodape: { alignItems: 'center', gap: spacing.one },
  convite: { fontSize: typography.fontSize.sm },
});
