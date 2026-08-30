import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheet, Button, Chip } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { typography } from '@shared/theme/typography';
import { spacing } from '@shared/theme/spacing';
import { getCausa } from './markerConfig';
import type { Problema } from '../types';

interface MapBottomSheetProps {
  problema: Problema | null;
  visible: boolean;
  onDismiss: () => void;
  onVerDetalhes: (id: number) => void;
  onApoiar?: (id: number) => void;
}

const META_APOIOS = 50;

export function MapBottomSheet({
  problema,
  visible,
  onDismiss,
  onVerDetalhes,
  onApoiar,
}: MapBottomSheetProps) {
  const theme = useAppTheme();
  if (!problema) return null;

  const causa = getCausa(problema.causa_id);
  const progresso = Math.min(100, Math.round((problema.cont_apoios / META_APOIOS) * 100));

  return (
    <BottomSheet visible={visible} onDismiss={onDismiss}>
      <View style={styles.head}>
        <View style={[styles.iconWrap, { backgroundColor: causa.cor }]}>
          <MaterialCommunityIcons
            name={causa.icone as keyof typeof MaterialCommunityIcons.glyphMap}
            size={26}
            color="#FFFFFF"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.titulo, { color: theme.colors.onSurface }]}>{problema.titulo}</Text>
          {problema.local_nome && (
            <Text style={[styles.local, { color: theme.colors.onSurfaceVariant }]}>
              {problema.local_nome}
            </Text>
          )}
        </View>
        <Chip compact>{causa.nome}</Chip>
      </View>

      {problema.descricao && (
        <Text style={[styles.desc, { color: theme.colors.onSurfaceVariant }]}>
          {problema.descricao}
        </Text>
      )}

      <View style={styles.apoioRow}>
        <MaterialCommunityIcons name="account-group" size={18} color={theme.colors.primary} />
        <Text style={[styles.apoioText, { color: theme.colors.onSurface }]}>
          {problema.cont_apoios} pessoas apoiam
        </Text>
      </View>

      <View style={[styles.bar, { backgroundColor: theme.colors.surfaceVariant }]}>
        <View style={[styles.barFill, { width: `${progresso}%`, backgroundColor: causa.cor }]} />
      </View>

      <View style={styles.actions}>
        {onApoiar && (
          <Button
            mode="contained"
            icon="thumb-up"
            onPress={() => onApoiar(problema.id)}
            style={{ flex: 1 }}
          >
            Apoiar
          </Button>
        )}
        <Button
          mode="outlined"
          onPress={() => onVerDetalhes(problema.id)}
          style={{ flex: 1 }}
        >
          Ver detalhes
        </Button>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.two, marginBottom: spacing.two },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontSize: typography.fontSize.lg, fontWeight: '700' },
  local: { fontSize: typography.fontSize.sm },
  desc: { fontSize: typography.fontSize.sm, marginBottom: spacing.three, lineHeight: 20 },
  apoioRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.one, marginBottom: spacing.one },
  apoioText: { fontSize: typography.fontSize.base, fontWeight: '600' },
  bar: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: spacing.three },
  barFill: { height: 8, borderRadius: 4 },
  actions: { flexDirection: 'row', gap: spacing.two },
});
