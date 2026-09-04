import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { formatarDataRelativa } from '@shared/utils/dataRelativa';
import type { EventoApresentado, ProblemaEventoTipo } from '../types';

const ICONE_POR_TIPO: Record<ProblemaEventoTipo, keyof typeof MaterialCommunityIcons.glyphMap> = {
  PROBLEMA_CRIADO: 'map-marker-plus-outline',
  EVIDENCIA_ADICIONADA: 'image-outline',
  COMENTARIO_CRIADO: 'comment-text-outline',
  MOBILIZACAO_CRIADA: 'account-group-outline',
  MOBILIZACAO_REALIZADA: 'check-circle-outline',
  ENCAMINHADO: 'send-outline',
  RESPOSTA_RECEBIDA: 'email-check-outline',
  STATUS_ALTERADO: 'swap-horizontal',
  RESOLVIDO: 'flag-checkered',
};

interface EventoItemProps {
  evento: EventoApresentado;
  ultimo: boolean;
}

export function EventoItem({ evento, ultimo }: EventoItemProps) {
  const theme = useAppTheme();
  const quando = formatarDataRelativa(evento.data);

  return (
    <View style={styles.evento}>
      <View style={styles.trilha}>
        <View style={[styles.marcador, { backgroundColor: theme.colors.primaryContainer }]}>
          <MaterialCommunityIcons
            name={ICONE_POR_TIPO[evento.tipo] ?? 'circle-outline'}
            size={16}
            color={theme.colors.primary}
          />
        </View>
        {!ultimo && (
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
        {quando !== '' && (
          <Text style={[styles.quando, { color: theme.colors.textTertiary }]}>{quando}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  evento: { flexDirection: 'row', gap: spacing.two },
  trilha: { alignItems: 'center', width: 28 },
  marcador: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linha: { width: 2, flex: 1, marginTop: spacing.half },
  conteudo: { flex: 1, paddingBottom: spacing.three, gap: 2 },
  titulo: { fontSize: typography.fontSize.base, fontWeight: '700' },
  autor: { fontSize: typography.fontSize.xs },
  descricao: { fontSize: typography.fontSize.sm, lineHeight: 20 },
  quando: { fontSize: typography.fontSize.xs },
});
