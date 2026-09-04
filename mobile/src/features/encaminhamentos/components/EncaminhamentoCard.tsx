import { View, Text, StyleSheet } from 'react-native';
import { Button, Card, Chip } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { formatarDataRelativa } from '@shared/utils/dataRelativa';
import { corStatusEncaminhamento, rotuloStatusEncaminhamento } from '../utils/status';
import type { Encaminhamento } from '../types';

interface EncaminhamentoCardProps {
  encaminhamento: Encaminhamento;
  onRegistrarResposta: (encaminhamento: Encaminhamento) => void;
}

export function EncaminhamentoCard({
  encaminhamento,
  onRegistrarResposta,
}: EncaminhamentoCardProps) {
  const theme = useAppTheme();
  const cor = corStatusEncaminhamento(encaminhamento.status);
  const quando = formatarDataRelativa(encaminhamento.criado_em);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.orgao, { color: theme.colors.onSurface }]} numberOfLines={2}>
          {encaminhamento.orgao.nome}
        </Text>
        <Chip compact mode="outlined" style={{ backgroundColor: cor, borderColor: cor }}>
          <Text style={styles.chipTexto}>{rotuloStatusEncaminhamento(encaminhamento.status)}</Text>
        </Chip>
      </View>

      <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
        {encaminhamento.referencia}
        {quando !== '' ? ` · ${quando}` : ''}
      </Text>

      {encaminhamento.resposta && (
        <View style={styles.resposta}>
          <Text style={[styles.rotulo, { color: theme.colors.textSecondary }]}>
            Resposta do órgão
          </Text>
          <Text style={[styles.texto, { color: theme.colors.onSurfaceVariant }]}>
            {encaminhamento.resposta}
          </Text>
          {encaminhamento.protocolo && (
            <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
              Protocolo {encaminhamento.protocolo}
            </Text>
          )}
        </View>
      )}

      {encaminhamento.pode_registrar_resposta && (
        <Button
          mode="outlined"
          icon="email-check-outline"
          onPress={() => onRegistrarResposta(encaminhamento)}
          style={styles.acao}
        >
          Registrar resposta
        </Button>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.three, gap: spacing.two },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.two },
  orgao: { flex: 1, fontSize: typography.fontSize.base, fontWeight: '700' },
  chipTexto: { color: '#FFFFFF', fontWeight: '700' },
  meta: { fontSize: typography.fontSize.xs },
  resposta: { gap: 2 },
  rotulo: { fontSize: typography.fontSize.xs, fontWeight: '700' },
  texto: { fontSize: typography.fontSize.sm, lineHeight: 20 },
  acao: { alignSelf: 'flex-start' },
});
