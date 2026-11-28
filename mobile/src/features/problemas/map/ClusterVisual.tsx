import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { corDaCausa } from '@shared/theme/theme';
import { texto } from '@shared/theme/typography';
import { getCausa } from './markerConfig';
import { mapShadow } from './mapTheme';
import type { Problema } from '../types';

type Icone = keyof typeof MaterialCommunityIcons.glyphMap;

interface ClusterVisualProps {
  pontos: Problema[];
}

/** Agrupamento: total e as 3 categorias mais presentes (ícone + contagem). */
export function ClusterVisual({ pontos }: ClusterVisualProps) {
  const theme = useAppTheme();
  const total = pontos.length;
  const contagem = new Map<number, number>();
  for (const p of pontos) {
    contagem.set(p.causa_id, (contagem.get(p.causa_id) ?? 0) + 1);
  }
  const top = [...contagem.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([causaId, qtd]) => ({ causa: getCausa(causaId), cor: corDaCausa(theme, causaId), qtd }));
  const resumo = top.map(({ causa, qtd }) => `${qtd} de ${causa.nome}`).join(', ');

  return (
    <View
      accessible
      accessibilityLabel={`${total} problemas aqui: ${resumo}. Toque para aproximar.`}
      style={[
        styles.card,
        mapShadow,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineStrong, shadowColor: theme.colors.shadow },
      ]}
    >
      <Text style={[styles.total, { color: theme.colors.onSurface }]}>{total}</Text>
      <View style={styles.rows}>
        {top.map(({ causa, cor, qtd }) => (
          <View key={causa.id} style={styles.row}>
            <MaterialCommunityIcons name={causa.icone as Icone} size={16} color={cor.cor} />
            <Text style={[styles.qtd, { color: theme.colors.onSurface }]}>{qtd}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    minHeight: 48,
  },
  total: { ...texto.numero, marginRight: 10 },
  rows: { gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtd: { ...texto.rotulo },
});
