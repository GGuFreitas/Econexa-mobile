import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, PilulaStatus } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { texto } from '@shared/theme/typography';
import { statusLabels, statusPapeis, statusIcones } from '../utils/statusTransitions';
import type { Mobilizacao } from '../types';

interface MobilizacaoCardProps {
  mobilizacao: Mobilizacao;
  onPress: (id: number) => void;
}

export function MobilizacaoCard({ mobilizacao, onPress }: MobilizacaoCardProps) {
  const theme = useAppTheme();
  const label = statusLabels[mobilizacao.status];
  const participantes =
    mobilizacao.cont_participantes === 1 ? '1 participante' : `${mobilizacao.cont_participantes} participantes`;
  const quando = mobilizacao.data_inicio ? formatDate(mobilizacao.data_inicio) : null;

  return (
    <Card
      onPress={() => onPress(mobilizacao.id)}
      accessibilityLabel={[mobilizacao.titulo, label, quando, participantes].filter(Boolean).join('. ')}
      style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
      mode="outlined"
    >
      <View style={styles.conteudo}>
        <PilulaStatus rotulo={label} papel={statusPapeis[mobilizacao.status]} icone={statusIcones[mobilizacao.status]} />
        <Text style={[styles.titulo, { color: theme.colors.onSurface }]} numberOfLines={2}>
          {mobilizacao.titulo}
        </Text>
        <View style={styles.linha}>
          {quando && (
            <View style={styles.item}>
              <MaterialCommunityIcons name="calendar-clock" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>{quando}</Text>
            </View>
          )}
          <View style={styles.item}>
            <MaterialCommunityIcons name="account-group" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>{participantes}</Text>
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
  card: { borderRadius: 16 },
  conteudo: { padding: spacing.three, gap: spacing.one },
  titulo: { ...texto.corpoForte, fontSize: 16 },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.three },
  item: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { ...texto.meta },
});
