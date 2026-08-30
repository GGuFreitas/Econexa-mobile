import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Chip } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { statusLabels, statusColors } from '../utils/statusTransitions';
import type { Mobilizacao } from '../types';

interface MobilizacaoCardProps {
  mobilizacao: Mobilizacao;
  onPress: (id: number) => void;
}

export function MobilizacaoCard({ mobilizacao, onPress }: MobilizacaoCardProps) {
  const theme = useAppTheme();
  const label = statusLabels[mobilizacao.status];
  const color = statusColors[mobilizacao.status];

  return (
    <Card onPress={() => onPress(mobilizacao.id)} style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={[styles.titulo, { color: theme.colors.onSurface }]} numberOfLines={1}>
          {mobilizacao.titulo}
        </Text>
      </View>
      <View style={styles.info}>
        {mobilizacao.data_inicio && (
          <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
            {formatDate(mobilizacao.data_inicio)}
          </Text>
        )}
        <View style={styles.footer}>
          <Chip compact mode="outlined" style={{ backgroundColor: color, borderColor: color }}>
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{label}</Text>
          </Chip>
          <View style={styles.participantes}>
            <MaterialCommunityIcons name="account-group" size={14} color={theme.colors.primary} />
            <Text style={[styles.participantesText, { color: theme.colors.onSurfaceVariant }]}>
              {mobilizacao.cont_participantes ?? 0}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  card: { padding: spacing.three, gap: spacing.two },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.two },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  titulo: { fontSize: typography.fontSize.base, fontWeight: '700', flex: 1 },
  info: { gap: spacing.one },
  infoText: { fontSize: typography.fontSize.sm },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.three, marginTop: spacing.one },
  participantes: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  participantesText: { fontSize: typography.fontSize.xs },
});