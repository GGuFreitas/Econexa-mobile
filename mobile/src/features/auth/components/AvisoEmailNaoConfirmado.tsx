import { Text, StyleSheet } from 'react-native';
import type { User } from '@store/authSlice';
import { Button } from '@shared/ui/Button';
import { Card } from '@shared/ui/Card';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { mensagemDeErro } from '@shared/utils/mensagemDeErro';
import { useReenviarVerificacao } from '../hooks/useReenviarVerificacao';
import { MensagemDeRetorno } from './MensagemDeRetorno';

const REENVIADO = 'Enviamos um novo link. Ele vale por 24 horas.';
const FALHA_NO_REENVIO = 'Não foi possível reenviar o e-mail. Tente novamente.';

type AvisoEmailNaoConfirmadoProps = { usuario: User };

export function AvisoEmailNaoConfirmado({ usuario }: AvisoEmailNaoConfirmadoProps) {
  const theme = useAppTheme();
  const reenvio = useReenviarVerificacao();

  if (usuario.email_verified) return null;

  const confirmacao = reenvio.isSuccess ? reenvio.data?.message || REENVIADO : null;
  const falha = reenvio.isError ? mensagemDeErro(reenvio.error, FALHA_NO_REENVIO) : null;
  const handleReenviar = () => reenvio.mutate();

  return (
    <Card style={[styles.card, { borderColor: theme.colors.warning }]}>
      <Text style={[styles.titulo, { color: theme.colors.onSurface }]}>Confirme seu e-mail</Text>
      <Text style={[styles.texto, { color: theme.colors.onSurfaceVariant }]}>
        Enviamos um link de confirmação para {usuario.email}. Abra o e-mail e toque no link:
        quando você voltar para o app, este aviso some.
      </Text>
      <MensagemDeRetorno texto={confirmacao} tipo="sucesso" />
      <MensagemDeRetorno texto={falha} />
      <Button
        mode="outlined"
        icon="email-send-outline"
        onPress={handleReenviar}
        loading={reenvio.isPending}
        disabled={reenvio.isPending}
      >
        Reenviar e-mail
      </Button>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.four, gap: spacing.two, marginBottom: spacing.three, borderWidth: 1 },
  titulo: { fontSize: typography.fontSize.md, fontWeight: '700' },
  texto: { fontSize: typography.fontSize.sm, lineHeight: 20 },
});
