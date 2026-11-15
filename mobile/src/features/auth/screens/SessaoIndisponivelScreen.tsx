import { View, StyleSheet } from 'react-native';
import { Button } from '@shared/ui/Button';
import { ErrorState } from '@shared/ui/ErrorState';
import { ScreenWrapper } from '@shared/ui/ScreenWrapper';
import { spacing } from '@shared/theme/spacing';
import { encerrarSessao, restaurarSessao } from '@shared/sessao/sessao';

const MENSAGEM =
  'Não conseguimos confirmar sua sessão agora. Verifique sua conexão e tente de novo: ' +
  'seu acesso continua salvo neste aparelho.';

export default function SessaoIndisponivelScreen() {
  const handleTentarDeNovo = () => restaurarSessao();
  const handleSair = () => encerrarSessao();

  return (
    <ScreenWrapper>
      <ErrorState message={MENSAGEM} onRetry={handleTentarDeNovo} />
      <View style={styles.rodape}>
        <Button mode="text" onPress={handleSair}>
          Sair da conta
        </Button>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  rodape: { alignItems: 'center', paddingBottom: spacing.four },
});
