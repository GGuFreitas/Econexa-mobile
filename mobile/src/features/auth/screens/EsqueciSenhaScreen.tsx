import { useState } from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePedirCodigo } from '@features/auth/hooks/usePedirCodigo';
import {
  EsqueciSenhaForm,
  type EsqueciSenhaFormValues,
} from '@features/auth/components/EsqueciSenhaForm';
import { MensagemDeRetorno } from '@features/auth/components/MensagemDeRetorno';
import { normalizarEmail } from '@features/auth/utils/email';
import { Header } from '@shared/ui/Header';
import { ScreenWrapper } from '@shared/ui/ScreenWrapper';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { mensagemDeErro } from '@shared/utils/mensagemDeErro';
import type { RootStackParamList } from '@navigation/AppNavigator';

type EsqueciSenhaNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function EsqueciSenhaScreen() {
  const navigation = useNavigation<EsqueciSenhaNavigationProp>();
  const theme = useAppTheme();
  const pedirCodigo = usePedirCodigo();
  const [falha, setFalha] = useState<string | null>(null);

  const handlePedirCodigo = async (valores: EsqueciSenhaFormValues) => {
    setFalha(null);
    const email = normalizarEmail(valores.email);
    try {
      await pedirCodigo.mutateAsync(email);
      navigation.navigate('RedefinirSenha', { email });
    } catch (erro) {
      setFalha(mensagemDeErro(erro, 'Não foi possível pedir o código. Tente novamente.'));
    }
  };
  const handleVoltar = () => navigation.goBack();

  return (
    <ScreenWrapper>
      <Header title="Esqueci minha senha" onBack={handleVoltar} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={[styles.explicacao, { color: theme.colors.onSurfaceVariant }]}>
          Informe o e-mail da sua conta. Vamos enviar um código de 6 números para você criar uma
          senha nova.
        </Text>
        <MensagemDeRetorno texto={falha} />
        <EsqueciSenhaForm onSubmit={handlePedirCodigo} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: spacing.three, gap: spacing.three },
  explicacao: { fontSize: typography.fontSize.sm, lineHeight: 20 },
});
