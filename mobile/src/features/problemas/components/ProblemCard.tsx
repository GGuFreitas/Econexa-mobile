import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { getCausa } from '../map/markerConfig';
import { useApoio } from '../hooks/useApoio';
import { META_APOIOS, progressoMeta } from '../utils/meta';
import { formatarDistancia } from '../utils/proximidade';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import type { ProblemaListado } from '../types';

type Icone = keyof typeof MaterialCommunityIcons.glyphMap;

interface ProblemCardProps {
  problema: ProblemaListado;
  apoiado: boolean;
  onPress: (id: number) => void;
}

const BRANCO = '#FFFFFF';
const BRANCO_SUAVE = 'rgba(255, 255, 255, 0.88)';

export function ProblemCard({ problema, apoiado, onPress }: ProblemCardProps) {
  const theme = useAppTheme();
  const causa = getCausa(problema.causa_id);
  const icone = causa.icone as Icone;
  const { apoiar, desapoiar } = useApoio(problema.id);
  const [semMovimento, setSemMovimento] = useState(false);
  const escala = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setSemMovimento)
      .catch(() => undefined);
  }, []);

  const total = problema.cont_apoios;
  const enviando = apoiar.isPending || desapoiar.isPending;
  const distancia =
    problema.distancia_m != null ? formatarDistancia(Number(problema.distancia_m)) : null;
  const local = [distancia, problema.local_nome].filter(Boolean).join(' · ');

  const pulsar = () => {
    if (semMovimento) return;
    escala.setValue(1);
    Animated.sequence([
      Animated.spring(escala, { toValue: 1.3, useNativeDriver: true, speed: 40, bounciness: 12 }),
      Animated.spring(escala, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
  };

  const alternarApoio = () => {
    if (apoiado) {
      desapoiar.mutate();
      return;
    }
    pulsar();
    apoiar.mutate();
  };

  return (
    <Pressable
      onPress={() => onPress(problema.id)}
      accessibilityRole="button"
      accessibilityLabel={`${problema.titulo}. ${causa.nome}. ${total} de ${META_APOIOS} apoios.`}
      style={[styles.card, { backgroundColor: causa.cor }]}
    >
      {problema.capa_url ? (
        <Image
          source={{ uri: problema.capa_url }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={styles.semFoto}>
          <MaterialCommunityIcons name={icone} size={96} color="rgba(255, 255, 255, 0.55)" />
        </View>
      )}

      <View style={[styles.selo, { backgroundColor: causa.cor }]}>
        <MaterialCommunityIcons name={icone} size={14} color={BRANCO} />
        <Text style={styles.seloTexto}>{causa.nome}</Text>
      </View>

      {problema.cont_imagens > 1 && (
        <View style={styles.contador}>
          <MaterialCommunityIcons name="image-multiple" size={14} color={BRANCO} />
          <Text style={styles.contadorTexto}>{problema.cont_imagens}</Text>
        </View>
      )}

      <View style={styles.painel}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.veu]} />

        <Text style={styles.titulo} numberOfLines={2}>
          {problema.titulo}
        </Text>

        {local !== '' && (
          <View style={styles.linha}>
            <MaterialCommunityIcons name="map-marker" size={14} color={BRANCO_SUAVE} />
            <Text style={styles.sub} numberOfLines={1}>
              {local}
            </Text>
          </View>
        )}

        {!problema.capa_url && (
          <View style={styles.linha}>
            <MaterialCommunityIcons name="camera-plus" size={14} color={BRANCO_SUAVE} />
            <Text style={styles.sub}>Ainda sem foto. Quem apoia pode enviar uma.</Text>
          </View>
        )}

        <View style={styles.rodape}>
          <View style={styles.meta}>
            <View style={styles.barra}>
              <View style={[styles.barraCheia, { width: `${progressoMeta(total)}%` }]} />
            </View>
            <Text style={styles.sub}>
              <Text style={styles.forte}>{total}</Text> de {META_APOIOS} apoios
            </Text>
          </View>

          <Animated.View style={{ transform: [{ scale: escala }] }}>
            <Pressable
              onPress={alternarApoio}
              disabled={enviando}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel={apoiado ? 'Você apoia. Toque para retirar o apoio' : 'Apoiar'}
              accessibilityState={{ selected: apoiado, busy: enviando }}
              style={[
                styles.botao,
                apoiado
                  ? styles.botaoAtivo
                  : { backgroundColor: theme.colors.secondary, borderColor: theme.colors.secondary },
              ]}
            >
              <MaterialCommunityIcons
                name={apoiado ? 'check-circle' : 'thumb-up'}
                size={18}
                color={apoiado ? theme.colors.primary : theme.colors.onSecondary}
              />
              <Text
                style={[
                  styles.botaoTexto,
                  { color: apoiado ? theme.colors.primary : theme.colors.onSecondary },
                ]}
              >
                {apoiado ? 'Apoiando' : 'Apoiar'}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { height: 300, borderRadius: 16, overflow: 'hidden' },
  semFoto: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    paddingTop: spacing.six,
  },
  selo: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.half,
    paddingVertical: 3,
    paddingLeft: 6,
    paddingRight: 9,
    borderRadius: 99,
  },
  seloTexto: { color: BRANCO, fontSize: typography.fontSize.xs + 1, fontWeight: '600' },
  contador: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.half,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
  },
  contadorTexto: { color: BRANCO, fontSize: typography.fontSize.xs, fontWeight: '500' },
  painel: {
    position: 'absolute',
    left: spacing.one,
    right: spacing.one,
    bottom: spacing.one,
    borderRadius: 12,
    overflow: 'hidden',
    paddingVertical: 10,
    paddingLeft: spacing.two,
    paddingRight: 10,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  veu: { backgroundColor: 'rgba(16, 18, 22, 0.58)' },
  titulo: { color: BRANCO, fontSize: typography.fontSize.md - 1, fontWeight: '700' },
  linha: { flexDirection: 'row', alignItems: 'center', gap: spacing.half },
  sub: { flexShrink: 1, color: BRANCO_SUAVE, fontSize: typography.fontSize.xs + 1 },
  forte: { color: BRANCO, fontWeight: '700' },
  rodape: { flexDirection: 'row', alignItems: 'center', gap: spacing.two, marginTop: 2 },
  meta: { flex: 1, minWidth: 0, gap: 5 },
  barra: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  barraCheia: { height: '100%', borderRadius: 2, backgroundColor: BRANCO },
  botao: {
    minHeight: 44,
    paddingHorizontal: spacing.three,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
  },
  botaoAtivo: { backgroundColor: BRANCO, borderColor: BRANCO },
  botaoTexto: { fontSize: typography.fontSize.sm + 1, fontWeight: '700' },
});
