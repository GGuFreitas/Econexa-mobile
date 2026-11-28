import { Text, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { User } from '@store/authSlice';
import { Button } from '@shared/ui/Button';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { texto } from '@shared/theme/typography';
import { mensagemDeErro } from '@shared/utils/mensagemDeErro';
import { useReenviarVerificacao } from '../hooks/useReenviarVerificacao';
import { MensagemDeRetorno } from './MensagemDeRetorno';

const REENVIADO = 'Enviamos um novo link. Ele vale por 24 horas.';
const FALHA_NO_REENVIO = 'Não deu para reenviar o e-mail. Tente de novo.';

type AvisoEmailNaoConfirmadoProps = { usuario: User };

export function AvisoEmailNaoConfirmado({ usuario }: AvisoEmailNaoConfirmadoProps) {
  const theme = useAppTheme();
  const reenvio = useReenviarVerificacao();

  if (usuario.email_verified) return null;

  const confirmacao = reenvio.isSuccess ? reenvio.data?.message || REENVIADO : null;
  const falha = reenvio.isError ? mensagemDeErro(reenvio.error, FALHA_NO_REENVIO) : null;
  const handleReenviar = () => reenvio.mutate();

  return (
    <View style={[styles.caixa, { backgroundColor: theme.colors.secondaryContainer }]}>
      <View style={styles.topo}>
        <MaterialCommunityIcons name="email-alert-outline" size={22} color={theme.colors.onSecondaryContainer} />
        <Text accessibilityRole="header" style={[styles.titulo, { color: theme.colors.onSurface }]}>
          Confirme seu e-mail
        </Text>
      </View>
      <Text style={[styles.texto, { color: theme.colors.onSurface }]}>
        Enviamos um link para {usuario.email}. Toque nele e, quando voltar para o app, este aviso some.
      </Text>
      <MensagemDeRetorno texto={confirmacao} tipo="sucesso" />
      <MensagemDeRetorno texto={falha} />
      <Button
        mode="outlined"
        icon="email-fast-outline"
        onPress={handleReenviar}
        loading={reenvio.isPending}
        disabled={reenvio.isPending}
        style={{ alignSelf: 'flex-start' }}
      >
        Reenviar e-mail
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: { borderRadius: 16, padding: spacing.three, gap: spacing.two },
  topo: { flexDirection: 'row', alignItems: 'center', gap: spacing.one },
  titulo: { ...texto.corpoForte, fontSize: 16, flex: 1 },
  texto: { ...texto.meta, fontSize: 14, lineHeight: 20 },
});
