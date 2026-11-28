import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { EmptyState } from '@shared/ui';
import { spacing } from '@shared/theme/spacing';
import { texto } from '@shared/theme/typography';
import { comAlfa } from '@shared/theme/alfa';
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
      <EmptyState
        compacto
        icon="account-group-outline"
        title="Nenhum mutirão ainda"
        description="Abra um problema e toque em Mutirão para organizar uma ação, ou entre numa que já existe."
      />
    );
  }

  return (
    <View style={styles.lista}>
      {acoes.map((acao) => {
        const status = statusLabels[acao.status] ?? acao.status;
        const quando = `${formatarDataHora(acao.data_inicio)} · ${rotuloPapel(acao.papel)}`;
        return (
          <Pressable
            key={acao.id}
            onPress={() => onAbrir(acao.id)}
            accessibilityRole="button"
            accessibilityLabel={`${acao.titulo}. ${status}. ${acao.problema_titulo}. ${quando}`}
            android_ripple={{ color: comAlfa(theme.colors.primary, 0.12) }}
            style={[styles.item, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
          >
            <View style={styles.topo}>
              <Text style={[styles.titulo, { color: theme.colors.onSurface }]} numberOfLines={2}>
                {acao.titulo}
              </Text>
              <View style={[styles.status, { backgroundColor: theme.colors.primaryContainer }]}>
                <Text style={[styles.statusTexto, { color: theme.colors.onPrimaryContainer }]}>{status}</Text>
              </View>
            </View>
            <Text style={[styles.sub, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
              {acao.problema_titulo}
            </Text>
            <View style={styles.linha}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.sub, { flex: 1, color: theme.colors.onSurfaceVariant }]}>{quando}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { gap: spacing.two, paddingHorizontal: spacing.three, paddingTop: spacing.three },
  item: { borderRadius: 16, borderWidth: 1, padding: spacing.three, gap: spacing.half, overflow: 'hidden' },
  topo: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.two },
  titulo: { ...texto.corpoForte, flex: 1 },
  status: { paddingHorizontal: spacing.one, paddingVertical: 2, borderRadius: 99 },
  statusTexto: { ...texto.rotulo },
  linha: { flexDirection: 'row', alignItems: 'center', gap: spacing.half },
  sub: { ...texto.meta },
});
