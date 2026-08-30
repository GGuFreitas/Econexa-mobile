import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCausa } from './markerConfig';
import { markerSizeByPriority, mapStateColors, mapShadow } from './mapTheme';
import type { Problema } from '../types';

interface ProblemMarkerProps {
  problema: Problema;
  onPress: (problema: Problema) => void;
}

/**
 * Marker do mapa Mutira.
 * Gramática visual:
 *  - Ícone + Cor = tipo (causa)
 *  - Tamanho = prioridade da causa
 *  - Anel + badge = mobilização (apoios)
 */
export function ProblemMarker({ problema, onPress }: ProblemMarkerProps) {
  const causa = getCausa(problema.causa_id);
  const size = markerSizeByPriority[causa.priority];
  const mobilizando = problema.cont_apoios > 0;

  return (
    <Marker
      coordinate={{ latitude: problema.lat, longitude: problema.lng }}
      onPress={() => onPress(problema)}
      tracksViewChanges={false}
    >
      <View style={styles.wrapper}>
        {mobilizando && (
          <View
            style={[
              styles.ring,
              {
                width: size + 14,
                height: size + 14,
                borderColor: mapStateColors.mobilizando,
              },
            ]}
          />
        )}
        <View
          style={[
            styles.bubble,
            {
              width: size,
              height: size,
              backgroundColor: causa.cor,
              borderRadius: size / 2,
              ...mapShadow,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={causa.icone as keyof typeof MaterialCommunityIcons.glyphMap}
            size={size * 0.52}
            color="#FFFFFF"
          />
        </View>
        {mobilizando && (
          <View style={[styles.badge, { borderColor: causa.cor }]}>
            <Text style={styles.badgeText}>{problema.cont_apoios}</Text>
          </View>
        )}
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 3,
    opacity: 0.55,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A1A1A',
  },
});
