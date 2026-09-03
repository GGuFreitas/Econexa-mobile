import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EmptyState, ErrorState, LoadingSpinner } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { formatarDataRelativa } from '@shared/utils/dataRelativa';
import type { EventoTimeline, TipoEventoTimeline } from '../types';

const ICONE_POR_TIPO: Record<TipoEventoTimeline, keyof typeof MaterialCommunityIcons.glyphMap> = {
  problema_criado: 'map-marker-plus-outline',
  evidencia_adicionada: 'image-outline',
  comentario_criado: 'comment-text-outline',
  mobilizacao_criada: 'account-group-outline',
  mobilizacao_realizada: 'check-circle-outline',
};

interface TimelineProps {
  eventos: EventoTimeline[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function Timeline({ eventos, isLoading, isError, onRetry }: TimelineProps) {
  const theme = useAppTheme();

  if (isLoading) return <LoadingSpinner size="small" />;
  if (isError) return <ErrorState message="Falha ao carregar a atividade." onRetry={onRetry} />;
  if (eventos.length === 0) {
    return (
      <EmptyState
        title="Sem atividade ainda"
        description="As ações registradas neste problema vão aparecer aqui."
      />
    );
  }

  return (
    <View style={styles.container}>
      {eventos.map((evento, index) => (
        <View key={evento.id} style={styles.evento}>
          <View style={styles.trilha}>
            <View style={[styles.marcador, { backgroundColor: theme.colors.primaryContainer }]}>
              <MaterialCommunityIcons
                name={ICONE_POR_TIPO[evento.tipo]}
                size={16}
                color={theme.colors.primary}
              />
            </View>
            {index < eventos.length - 1 && (
              <View style={[styles.linha, { backgroundColor: theme.colors.outlineVariant }]} />
            )}
          </View>
          <View style={styles.conteudo}>
            <Text style={[styles.titulo, { color: theme.colors.onSurface }]}>{evento.titulo}</Text>
            {evento.autor && (
              <Text style={[styles.autor, { color: theme.colors.textSecondary }]}>
                por {evento.autor}
              </Text>
            )}
            {evento.descricao && (
              <Text
                style={[styles.descricao, { color: theme.colors.onSurfaceVariant }]}
                numberOfLines={3}
              >
                {evento.descricao}
              </Text>
            )}
            <Text style={[styles.quando, { color: theme.colors.textTertiary }]}>
              {formatarDataRelativa(evento.data)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.two },
  evento: { flexDirection: 'row', gap: spacing.two },
  trilha: { alignItems: 'center', width: 28 },
  marcador: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  linha: { width: 2, flex: 1, marginTop: spacing.half },
  conteudo: { flex: 1, paddingBottom: spacing.three, gap: 2 },
  titulo: { fontSize: typography.fontSize.base, fontWeight: '700' },
  autor: { fontSize: typography.fontSize.xs },
  descricao: { fontSize: typography.fontSize.sm, lineHeight: 20 },
  quando: { fontSize: typography.fontSize.xs },
});
