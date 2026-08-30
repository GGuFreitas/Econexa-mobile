import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCausa } from './markerConfig';
import { mapShadow } from './mapTheme';
import type { Problema } from '../types';

interface ProblemClusterProps {
  pontos: Problema[];
  onPress: () => void;
}

/**
 * Cluster inteligente: mostra distribuição por categoria
 * (ex: 🚌12  🌳4  ⚠️2) em vez de apenas um contador genérico.
 */
export function ProblemCluster({ pontos, onPress }: ProblemClusterProps) {
  const total = pontos.length;
  const contagem = new Map<number, number>();
  for (const p of pontos) {
    contagem.set(p.causa_id, (contagem.get(p.causa_id) ?? 0) + 1);
  }
  const top = [...contagem.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([causaId, qtd]) => ({ causa: getCausa(causaId), qtd }));

  const primeira = pontos[0];

  return (
    <Marker
      coordinate={{ latitude: primeira.lat, longitude: primeira.lng }}
      onPress={onPress}
      tracksViewChanges={false}
    >
      <View style={[styles.card, mapShadow]}>
        <Text style={styles.total}>{total}</Text>
        <View style={styles.rows}>
          {top.map(({ causa, qtd }) => (
            <View key={causa.id} style={styles.row}>
              <MaterialCommunityIcons
                name={causa.icone as keyof typeof MaterialCommunityIcons.glyphMap}
                size={14}
                color={causa.cor}
              />
              <Text style={[styles.qtd, { color: causa.cor }]}>{qtd}</Text>
            </View>
          ))}
        </View>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E6EC',
  },
  total: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginRight: 10,
  },
  rows: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qtd: {
    fontSize: 13,
    fontWeight: '700',
  },
});
