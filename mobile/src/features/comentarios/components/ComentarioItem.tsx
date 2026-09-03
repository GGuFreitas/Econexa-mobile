import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { formatarDataRelativa } from '@shared/utils/dataRelativa';
import type { Comentario } from '../types';

interface ComentarioItemProps {
  comentario: Comentario;
  onExcluir: (comentario: Comentario) => void;
  excluindo: boolean;
}

export function ComentarioItem({ comentario, onExcluir, excluindo }: ComentarioItemProps) {
  const theme = useAppTheme();
  const quando = formatarDataRelativa(comentario.criado_em);

  const handleExcluir = () => onExcluir(comentario);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.identidade}>
          <Text style={[styles.autor, { color: theme.colors.onSurface }]} numberOfLines={1}>
            {comentario.autor.nome}
          </Text>
          {quando !== '' && (
            <Text style={[styles.quando, { color: theme.colors.textSecondary }]}>{quando}</Text>
          )}
        </View>
        {comentario.pode_excluir && (
          <TouchableOpacity
            onPress={handleExcluir}
            disabled={excluindo}
            hitSlop={8}
            accessibilityLabel="Excluir comentário"
          >
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={20}
              color={excluindo ? theme.colors.textTertiary : theme.colors.error}
            />
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.conteudo, { color: theme.colors.onSurfaceVariant }]}>
        {comentario.conteudo}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.three, gap: spacing.one },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.two },
  identidade: { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: spacing.two },
  autor: { fontSize: typography.fontSize.base, fontWeight: '700', flexShrink: 1 },
  quando: { fontSize: typography.fontSize.xs },
  conteudo: { fontSize: typography.fontSize.sm, lineHeight: 20 },
});
