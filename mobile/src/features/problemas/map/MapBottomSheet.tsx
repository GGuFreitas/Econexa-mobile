import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheet, Button } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { corDaCausa } from '@shared/theme/theme';
import { texto } from '@shared/theme/typography';
import { spacing } from '@shared/theme/spacing';
import { getCausa } from './markerConfig';
import { META_APOIOS, progressoMeta } from '../utils/meta';
import { formatarDistancia } from '../utils/proximidade';
import type { Problema } from '../types';

type Icone = keyof typeof MaterialCommunityIcons.glyphMap;

interface MapBottomSheetProps {
  problema: Problema | null;
  visible: boolean;
  apoiado: boolean;
  onDismiss: () => void;
  onVerDetalhes: (id: number) => void;
  onAlternarApoio: () => void;
  enviando?: boolean;
}

/** Prévia do problema ao tocar no marcador: o que é, onde, quanta gente apoia. */
export function MapBottomSheet({
  problema,
  visible,
  apoiado,
  onDismiss,
  onVerDetalhes,
  onAlternarApoio,
  enviando,
}: MapBottomSheetProps) {
  const theme = useAppTheme();
  if (!problema) return null;

  const causa = getCausa(problema.causa_id);
  const cor = corDaCausa(theme, problema.causa_id);
  const progresso = progressoMeta(problema.cont_apoios);
  const distancia =
    problema.distancia_m != null ? formatarDistancia(Number(problema.distancia_m)) : null;
  const linha = [causa.nome, distancia, problema.local_nome].filter(Boolean).join(' · ');

  return (
    <BottomSheet visible={visible} onDismiss={onDismiss}>
      <View style={styles.head}>
        <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.iconWrap, { backgroundColor: cor.cor }]}>
          <MaterialCommunityIcons name={causa.icone as Icone} size={26} color={cor.sobre} />
        </View>
        <View style={styles.textos}>
          <Text accessibilityRole="header" style={[styles.titulo, { color: theme.colors.onSurface }]}>
            {problema.titulo}
          </Text>
          <Text style={[styles.local, { color: theme.colors.onSurfaceVariant }]}>{linha}</Text>
        </View>
      </View>

      {problema.descricao && (
        <Text numberOfLines={3} style={[styles.desc, { color: theme.colors.onSurfaceVariant }]}>
          {problema.descricao}
        </Text>
      )}

      <View
        accessible
        accessibilityLabel={`${problema.cont_apoios} de ${META_APOIOS} apoios para a meta`}
        style={styles.meta}
      >
        <View style={styles.apoioRow}>
          <MaterialCommunityIcons name="account-group" size={20} color={theme.colors.secondary} />
          <Text style={[styles.apoioText, { color: theme.colors.onSurface }]}>
            {problema.cont_apoios} de {META_APOIOS} apoios
          </Text>
        </View>
        <View style={[styles.bar, { backgroundColor: theme.colors.surfaceVariant }]}>
          <View style={[styles.barFill, { width: `${progresso}%`, backgroundColor: theme.colors.secondary }]} />
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          mode="contained"
          icon={apoiado ? 'check-circle' : 'thumb-up'}
          loading={enviando}
          disabled={enviando}
          onPress={onAlternarApoio}
          buttonColor={apoiado ? theme.colors.primaryContainer : theme.colors.secondary}
          textColor={apoiado ? theme.colors.onPrimaryContainer : theme.colors.onSecondary}
          accessibilityHint={apoiado ? 'Toque para retirar o apoio' : undefined}
          accessibilityState={{ selected: apoiado, busy: enviando }}
          style={styles.acao}
        >
          {apoiado ? 'Apoiando' : 'Apoiar'}
        </Button>
        <Button mode="outlined" onPress={() => onVerDetalhes(problema.id)} style={styles.acao}>
          Ver detalhes
        </Button>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.two, marginBottom: spacing.two },
  iconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1, gap: 2 },
  titulo: { ...texto.tituloSecao, fontSize: 19, lineHeight: 25 },
  local: { ...texto.meta },
  desc: { ...texto.corpo, marginBottom: spacing.three },
  meta: { gap: spacing.one, marginBottom: spacing.four },
  apoioRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.one },
  apoioText: { ...texto.corpoForte },
  bar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  actions: { flexDirection: 'row', gap: spacing.two },
  acao: { flex: 1 },
});
