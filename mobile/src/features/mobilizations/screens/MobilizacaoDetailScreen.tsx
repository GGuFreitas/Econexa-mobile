import { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Header,
  ScreenWrapper,
  Card,
  Button,
  Chip,
  LoadingSpinner,
  ErrorState,
  Modal,
} from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { statusLabels, statusColors } from '../utils/statusTransitions';
import { useMobilizacao } from '../hooks/useMobilizacao';
import { useParticipar } from '../hooks/useParticipar';
import { useSair } from '../hooks/useSair';
import { useAtualizarStatus } from '../hooks/useAtualizarStatus';
import { useAdicionarResultado } from '../hooks/useAdicionarResultado';
import { ResultadoForm } from '../components/ResultadoForm';
import type { MobilizacaoStatus } from '../types';

interface RouteParams {
  id: number;
}

const STATUS_LABELS: Record<string, string> = {
  agendada: 'Agendada',
  em_andamento: 'Em andamento',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
};

export function MobilizacaoDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params as RouteParams;
  const theme = useAppTheme();

  const { data: mobilizacao, isLoading, isError } = useMobilizacao(id);
  const participar = useParticipar();
  const sair = useSair();
  const atualizarStatus = useAtualizarStatus();
  const adicionarResultado = useAdicionarResultado();
  const [resultadoAberto, setResultadoAberto] = useState(false);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !mobilizacao) return <ErrorState message="Mobilização não encontrada." />;

  const label = STATUS_LABELS[mobilizacao.status];
  const color = statusColors[mobilizacao.status as keyof typeof statusColors] ?? '#64748B';
  const isCriador = true; // TODO: verificar se é o criador
  const jaParticipa = mobilizacao.usuario_participa;

  const handleParticipar = () => {
    participar.mutate(mobilizacao.id);
  };

  const handleSair = () => {
    sair.mutate(mobilizacao.id);
  };

  const handleStatusChange = (novoStatus: MobilizacaoStatus) => {
    atualizarStatus.mutate({ id: mobilizacao.id, status: novoStatus });
  };

  const handleAdicionarResultado = (data: { descricao: string; metricas?: Record<string, number> }) => {
    adicionarResultado.mutate({ id: mobilizacao.id, input: data }, {
      onSuccess: () => setResultadoAberto(false),
    });
  };

  return (
    <ScreenWrapper>
      <Header title="Mobilização" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={[styles.statusBadge, { backgroundColor: color }]}>
            <Text style={styles.statusBadgeText}>{label}</Text>
          </View>
          <Text style={[styles.titulo, { color: theme.colors.onSurface }]}>{mobilizacao.titulo}</Text>
        </View>

        {mobilizacao.data_inicio && (
          <Card style={styles.infoCard}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color={theme.colors.primary} />
            <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
              {formatDateTime(mobilizacao.data_inicio)}
              {mobilizacao.data_fim && ` — ${formatDateTime(mobilizacao.data_fim)}`}
            </Text>
          </Card>
        )}

        {mobilizacao.local_nome && (
          <Card style={styles.infoCard}>
            <MaterialCommunityIcons name="map-marker" size={20} color={theme.colors.primary} />
            <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
              {mobilizacao.local_nome}
            </Text>
          </Card>
        )}

        <Card style={styles.infoCard}>
          <MaterialCommunityIcons name="account-group" size={20} color={theme.colors.primary} />
          <Text style={[styles.infoText, { color: theme.colors.onSurface }]}>
            {mobilizacao.cont_participantes ?? 0} participantes
          </Text>
        </Card>

        {mobilizacao.descricao && (
          <Text style={[styles.desc, { color: theme.colors.onSurfaceVariant }]}>
            {mobilizacao.descricao}
          </Text>
        )}

        {mobilizacao.status === 'realizada' && mobilizacao.resultado_descricao && (
          <Card style={styles.resultadoCard}>
            <Text style={[styles.resultadoTitulo, { color: theme.colors.onSurface }]}>Resultado</Text>
            <Text style={[styles.desc, { color: theme.colors.onSurfaceVariant }]}>
              {mobilizacao.resultado_descricao}
            </Text>
            {mobilizacao.resultado_metricas && (
              <View style={styles.metricas}>
                {Object.entries(mobilizacao.resultado_metricas).map(([key, value]) => (
                  <View key={key} style={styles.metrica}>
                    <Text style={[styles.metricaLabel, { color: theme.colors.onSurfaceVariant }]}>
                      {formatMetrica(key)}
                    </Text>
                    <Text style={[styles.metricaValor, { color: theme.colors.onSurface }]}>{value}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}

        <View style={styles.actions}>
          {mobilizacao.status === 'agendada' && (
            <>
              <Button
                mode={jaParticipa ? 'outlined' : 'contained'}
                icon={jaParticipa ? 'account-remove' : 'account-plus'}
                loading={participar.isPending || sair.isPending}
                onPress={jaParticipa ? handleSair : handleParticipar}
                style={{ flex: 1 }}
              >
                {jaParticipa ? 'Sair' : 'Participar'}
              </Button>
              {isCriador && (
                <Button mode="outlined" icon="play" onPress={() => handleStatusChange('em_andamento')}>
                  Iniciar
                </Button>
              )}
            </>
          )}
          {mobilizacao.status === 'em_andamento' && isCriador && (
            <Button
              mode="contained"
              icon="check"
              onPress={() => handleStatusChange('realizada')}
              style={{ flex: 1 }}
            >
              Marcar como realizada
            </Button>
          )}
          {mobilizacao.status === 'realizada' && !mobilizacao.resultado_descricao && isCriador && (
            <Button
              mode="contained"
              icon="clipboard-text"
              onPress={() => setResultadoAberto(true)}
              style={{ flex: 1 }}
            >
              Adicionar resultado
            </Button>
          )}
          {mobilizacao.status === 'agendada' && isCriador && (
            <Button mode="outlined" icon="cancel" onPress={() => handleStatusChange('cancelada')}>
              Cancelar
            </Button>
          )}
        </View>
      </ScrollView>

      <Modal visible={resultadoAberto} onDismiss={() => setResultadoAberto(false)}>
        <View style={styles.modal}>
          <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Registrar resultado</Text>
          <ResultadoForm
            onSubmit={handleAdicionarResultado}
            submitting={adicionarResultado.isPending}
            onCancel={() => setResultadoAberto(false)}
          />
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMetrica(key: string): string {
  const labels: Record<string, string> = {
    sacos: 'Sacos',
    pessoas: 'Pessoas',
    horas: 'Horas',
  };
  return labels[key] ?? key;
}

const styles = StyleSheet.create({
  container: { padding: spacing.four, gap: spacing.three },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.two },
  statusBadge: {
    paddingHorizontal: spacing.two,
    paddingVertical: spacing.one,
    borderRadius: 999,
  },
  statusBadgeText: { color: '#FFFFFF', fontWeight: '700', fontSize: typography.fontSize.xs },
  titulo: { fontSize: typography.fontSize.xl, fontWeight: '700', flex: 1 },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.two, padding: spacing.three },
  infoText: { fontSize: typography.fontSize.base },
  desc: { fontSize: typography.fontSize.sm, lineHeight: 22, marginTop: spacing.two },
  resultadoCard: { gap: spacing.two, padding: spacing.three },
  resultadoTitulo: { fontSize: typography.fontSize.lg, fontWeight: '700' },
  metricas: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.three, marginTop: spacing.two },
  metrica: { flexDirection: 'row', alignItems: 'center', gap: spacing.one },
  metricaLabel: { fontSize: typography.fontSize.sm },
  metricaValor: { fontSize: typography.fontSize.base, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: spacing.two, flexWrap: 'wrap' },
  modal: { padding: spacing.four, gap: spacing.three },
  modalTitle: { fontSize: typography.fontSize.lg, fontWeight: '700' },
});