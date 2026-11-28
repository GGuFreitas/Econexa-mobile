import { View, Text, StyleSheet } from 'react-native';
import { Button, Card, PilulaStatus } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { texto } from '@shared/theme/typography';
import { formatarDataRelativa } from '@shared/utils/dataRelativa';
import {
  AVISO_RESPOSTA_NAO_VERIFICADA,
  iconeStatusEncaminhamento,
  papelStatusEncaminhamento,
  rotuloDoRelato,
  rotuloStatusEncaminhamento,
} from '../utils/status';
import type { Encaminhamento } from '../types';

interface EncaminhamentoCardProps {
  encaminhamento: Encaminhamento;
  onRegistrarResposta: (encaminhamento: Encaminhamento) => void;
  onReenviar: (encaminhamento: Encaminhamento) => void;
  reenviando: boolean;
}

export function EncaminhamentoCard({
  encaminhamento,
  onRegistrarResposta,
  onReenviar,
  reenviando,
}: EncaminhamentoCardProps) {
  const theme = useAppTheme();
  const quando = formatarDataRelativa(encaminhamento.criado_em);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={[styles.orgao, { color: theme.colors.onSurface }]} numberOfLines={2}>
          {encaminhamento.orgao.nome}
        </Text>
        <PilulaStatus
          rotulo={rotuloStatusEncaminhamento(encaminhamento.status)}
          papel={papelStatusEncaminhamento(encaminhamento.status)}
          icone={iconeStatusEncaminhamento(encaminhamento.status)}
        />
      </View>

      <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
        {encaminhamento.referencia}
        {quando !== '' ? ` · ${quando}` : ''}
      </Text>

      {encaminhamento.falha_motivo && (
        <Text style={[styles.falha, { color: theme.colors.error }]}>
          {encaminhamento.falha_motivo}
        </Text>
      )}

      {encaminhamento.resposta && (
        <View style={styles.resposta}>
          <Text style={[styles.rotulo, { color: theme.colors.textSecondary }]}>
            {rotuloDoRelato(encaminhamento.autor.nome)}
          </Text>
          <Text style={[styles.texto, { color: theme.colors.onSurfaceVariant }]}>
            {encaminhamento.resposta}
          </Text>
          {encaminhamento.protocolo && (
            <Text style={[styles.meta, { color: theme.colors.textSecondary }]}>
              Protocolo {encaminhamento.protocolo}
            </Text>
          )}
          {!encaminhamento.resposta_verificada && (
            <Text style={[styles.aviso, { color: theme.colors.textSecondary }]}>
              {AVISO_RESPOSTA_NAO_VERIFICADA}
            </Text>
          )}
        </View>
      )}

      <View style={styles.acoes}>
        {encaminhamento.pode_reenviar && (
          <Button
            mode="outlined"
            icon="email-sync-outline"
            loading={reenviando}
            disabled={reenviando}
            onPress={() => onReenviar(encaminhamento)}
          >
            Reenviar ao órgão
          </Button>
        )}

        {encaminhamento.pode_registrar_resposta && (
          <Button
            mode="outlined"
            icon="email-check-outline"
            onPress={() => onRegistrarResposta(encaminhamento)}
          >
            Registrar resposta
          </Button>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.three, gap: spacing.two },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.two },
  orgao: { ...texto.corpoForte, flex: 1 },
  meta: { ...texto.meta },
  falha: { ...texto.meta },
  resposta: { gap: 2 },
  rotulo: { ...texto.rotulo },
  texto: { ...texto.corpo },
  aviso: { ...texto.meta, fontStyle: 'italic' },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.two },
});
