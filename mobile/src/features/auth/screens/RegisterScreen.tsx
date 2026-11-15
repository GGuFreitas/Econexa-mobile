import { useState } from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRegister } from '@features/auth/hooks/useRegister';
import { RegisterForm, type RegisterFormValues } from '@features/auth/components/RegisterForm';
import { MensagemDeRetorno } from '@features/auth/components/MensagemDeRetorno';
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
  const [falha, setFalha] = useState<string | null>(null);

  const handleRegister = async (dados: RegisterFormValues) => {
    setFalha(null);
    try {
      await registerMutation.mutateAsync({
        nome: dados.nome,
        email: dados.email,
        password: dados.password,
      });
      navigation.navigate('Main');
    } catch (erro) {
      setFalha(mensagemDeErro(erro, 'Não foi possível criar a conta. Tente novamente.'));
    }
  };
  const handleVoltar = () => navigation.goBack();

  return (
    <ScreenWrapper>
      <Header title="Criar conta" onBack={handleVoltar} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={[styles.convite, { color: theme.colors.onSurfaceVariant }]}>
          Sua conta nasce como cidadão. É ela que permite relatar problemas, apoiar e organizar
          mobilizações. Depois do cadastro, enviamos um link para confirmar seu e-mail.
        </Text>
        <MensagemDeRetorno texto={falha} />
        <RegisterForm onSubmit={handleRegister} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: spacing.three, gap: spacing.three },
  convite: { fontSize: typography.fontSize.sm, lineHeight: 20 },
});
