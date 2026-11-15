import { useState } from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useExcluirConta } from '@features/auth/hooks/useExcluirConta';
import {
  ExcluirContaForm,
  type ExcluirContaFormValues,
} from '@features/auth/components/ExcluirContaForm';
import { MensagemDeRetorno } from '@features/auth/components/MensagemDeRetorno';
import { Header } from '@shared/ui/Header';
import { ScreenWrapper } from '@shared/ui/ScreenWrapper';
import { LoadingSpinner } from '@shared/ui/LoadingSpinner';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { mensagemDeErro } from '@shared/utils/mensagemDeErro';
import { useAppSelector } from '@store/hooks';
import type { RootStackParamList } from '@navigation/AppNavigator';

type ExcluirContaNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ExcluirContaScreen() {
  const navigation = useNavigation<ExcluirContaNavigationProp>();
  const theme = useAppTheme();
  const user = useAppSelector((state) => state.auth.user);
  const exclusao = useExcluirConta();
  const [falha, setFalha] = useState<string | null>(null);

  if (!user) return <LoadingSpinner />;

  const handleExcluir = async ({ confirmacao }: ExcluirContaFormValues) => {
    setFalha(null);
    try {
      await exclusao.mutateAsync(user.has_password ? { password: confirmacao } : {});
      navigation.navigate('Main');
    } catch (erro) {
      setFalha(mensagemDeErro(erro, 'Não foi possível excluir a conta. Tente novamente.'));
    }
  };
  const handleVoltar = () => navigation.goBack();

  return (
    <ScreenWrapper>
      <Header title="Excluir conta" onBack={handleVoltar} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={[styles.titulo, { color: theme.colors.onSurface }]}>
          Esta ação não pode ser desfeita.
        </Text>
        <Text style={[styles.texto, { color: theme.colors.onSurfaceVariant }]}>
          Apagamos seu nome, e-mail, senha, as sessões abertas e o vínculo com o Google. Você não
          vai mais conseguir entrar com esta conta.
        </Text>
        <Text style={[styles.texto, { color: theme.colors.onSurfaceVariant }]}>
          Os problemas, comentários e apoios que você publicou continuam visíveis para a
          comunidade, assinados como "Conta excluída", sem nada que identifique você.
        </Text>
        <MensagemDeRetorno texto={falha} />
        <ExcluirContaForm temSenha={user.has_password} onSubmit={handleExcluir} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: spacing.three, gap: spacing.three },
  titulo: { fontSize: typography.fontSize.md, fontWeight: '700' },
  texto: { fontSize: typography.fontSize.sm, lineHeight: 20 },
});
