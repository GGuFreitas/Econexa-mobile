import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { statusLabels } from '@features/mobilizations/utils/statusTransitions';
import { formatarDataHora, rotuloPapel } from '../utils/perfil';
import type { AcaoDoUsuario } from '../types';

interface ListaAcoesProps {
  acoes: AcaoDoUsuario[];
  onAbrir: (id: number) => void;
}

export function ListaAcoes({ acoes, onAbrir }: ListaAcoesProps) {
  const theme = useAppTheme();

  if (acoes.length === 0) {
    return (
      <Text style={[styles.vazio, { color: theme.colors.onSurfaceVariant }]}>
        Você ainda não organizou nem participou de nenhuma ação.
      </Text>
    );
  }

  return (
    <View style={styles.lista}>
      {acoes.map((acao) => (
        <Pressable
          key={acao.id}
          onPress={() => onAbrir(acao.id)}
          accessibilityRole="button"
          style={[styles.item, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow }]}
        >
          <View style={styles.topo}>
            <Text style={[styles.titulo, { color: theme.colors.onSurface }]} numberOfLines={2}>
              {acao.titulo}
            </Text>
            <Text
              style={[
                styles.status,
                { backgroundColor: theme.colors.primaryContainer, color: theme.colors.primary },
              ]}
            >
              {statusLabels[acao.status] ?? acao.status}
            </Text>
          </View>
          <Text style={[styles.sub, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
            {acao.problema_titulo}
          </Text>
          <View style={styles.linha}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.sub, { color: theme.colors.onSurfaceVariant }]}>
              {formatarDataHora(acao.data_inicio)} · {rotuloPapel(acao.papel)}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { gap: spacing.one + 2, paddingHorizontal: spacing.two, paddingTop: spacing.two },
  item: {
    borderRadius: 12,
    padding: spacing.two,
    gap: 4,
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  topo: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.one },
  titulo: { flex: 1, fontSize: typography.fontSize.base - 1, fontWeight: '700' },
  status: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    overflow: 'hidden',
  },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sub: { fontSize: typography.fontSize.sm - 0.5 },
  vazio: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.four,
    paddingVertical: spacing.four,
  },
});
