import { useState } from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRedefinirSenha } from '@features/auth/hooks/useRedefinirSenha';
import {
  RedefinirSenhaForm,
  type RedefinirSenhaFormValues,
} from '@features/auth/components/RedefinirSenhaForm';
import { MensagemDeRetorno } from '@features/auth/components/MensagemDeRetorno';
import { Button } from '@shared/ui/Button';
import { Header } from '@shared/ui/Header';
import { ScreenWrapper } from '@shared/ui/ScreenWrapper';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { mensagemDeErro } from '@shared/utils/mensagemDeErro';
import type { RootStackParamList } from '@navigation/AppNavigator';

type RedefinirSenhaNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RedefinirSenhaRouteProp = RouteProp<RootStackParamList, 'RedefinirSenha'>;

export default function RedefinirSenhaScreen() {
  const navigation = useNavigation<RedefinirSenhaNavigationProp>();
  const { params } = useRoute<RedefinirSenhaRouteProp>();
  const theme = useAppTheme();
  const redefinir = useRedefinirSenha();
  const [falha, setFalha] = useState<string | null>(null);

  const handleRedefinir = async (valores: RedefinirSenhaFormValues) => {
    setFalha(null);
    try {
      await redefinir.mutateAsync({
        email: params.email,
        code: valores.codigo,
        password: valores.password,
      });
      navigation.navigate('Main');
    } catch (erro) {
      setFalha(mensagemDeErro(erro, 'Não foi possível redefinir a senha. Tente novamente.'));
    }
  };
  const handleVoltar = () => navigation.goBack();

  return (
    <ScreenWrapper>
      <Header title="Redefinir senha" onBack={handleVoltar} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={[styles.explicacao, { color: theme.colors.onSurfaceVariant }]}>
          Se existir uma conta com {params.email}, enviamos para lá um código de 6 números. Ele
          vale por 30 minutos e só pode ser usado uma vez. Ao trocar a senha, sua conta sai dos
          outros aparelhos em que estiver aberta.
        </Text>
        <MensagemDeRetorno texto={falha} />
        <RedefinirSenhaForm onSubmit={handleRedefinir} />
        <Button mode="text" onPress={handleVoltar}>
          Não recebeu? Peça outro código
        </Button>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: spacing.three, gap: spacing.three },
  explicacao: { fontSize: typography.fontSize.sm, lineHeight: 20 },
});
