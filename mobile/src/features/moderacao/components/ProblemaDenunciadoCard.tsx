import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@shared/ui/Card';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { resumoDosMotivos } from '../utils/motivos';
import type { ProblemaDenunciado } from '../types';

type ProblemaDenunciadoCardProps = {
  item: ProblemaDenunciado;
  onPress: (item: ProblemaDenunciado) => void;
};

export function ProblemaDenunciadoCard({ item, onPress }: ProblemaDenunciadoCardProps) {
  const theme = useAppTheme();
  const motivos = resumoDosMotivos(item.motivos)
    .map(({ rotulo, quantidade }) => (quantidade > 1 ? `${rotulo} (${quantidade})` : rotulo))
    .join(' · ');
  const autor = item.autor_bloqueado ? `Por ${item.autor_nome} · conta bloqueada` : `Por ${item.autor_nome}`;
  const total = `${item.total_denuncias} ${item.total_denuncias === 1 ? 'denúncia' : 'denúncias'}`;
  const handlePress = () => onPress(item);

  return (
    <Pressable onPress={handlePress} accessibilityRole="button">
      <Card style={styles.card}>
        <View style={styles.topo}>
          <Text style={[styles.titulo, { color: theme.colors.onSurface }]} numberOfLines={2}>
            {item.titulo}
          </Text>
          <Text style={[styles.total, { color: theme.colors.error }]}>{total}</Text>
        </View>
        <Text style={[styles.linha, { color: theme.colors.onSurfaceVariant }]}>{motivos}</Text>
        <Text style={[styles.linha, { color: theme.colors.onSurfaceVariant }]}>{autor}</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.three, gap: spacing.one },
  topo: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.two },
  titulo: { flex: 1, fontSize: typography.fontSize.base, fontWeight: '600' },
  total: { fontSize: typography.fontSize.sm, fontWeight: '700' },
  linha: { fontSize: typography.fontSize.sm },
});
