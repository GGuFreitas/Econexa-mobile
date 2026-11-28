import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing } from '@shared/theme/spacing';
import { texto, ALVO_MINIMO } from '@shared/theme/typography';
import { corDaCausa } from '@shared/theme/theme';
import { comAlfa } from '@shared/theme/alfa';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { getCausa } from '../map/markerConfig';
import { useApoio } from '../hooks/useApoio';
import { META_APOIOS, progressoMeta } from '../utils/meta';
import { formatarDistancia } from '../utils/proximidade';
import type { ProblemaListado } from '../types';

type Icone = keyof typeof MaterialCommunityIcons.glyphMap;

interface ProblemCardProps {
  problema: ProblemaListado;
  apoiado: boolean;
  onPress: (id: number) => void;
  /** Avisado quando o apoio é retirado, com como desfazer. */
  onApoioRetirado?: (desfazer: () => void) => void;
}

const ALTURA_MINIMA = 300;

/**
 * Cartão do Feed: foto de ponta a ponta, selo da categoria, painel de vidro
 * com o véu escuro de reserva e o Apoiar num toque.
 * Abrir o problema e Apoiar são dois alvos separados (leitor de tela chega aos dois).
 */
export function ProblemCard({ problema, apoiado, onPress, onApoioRetirado }: ProblemCardProps) {
  const theme = useAppTheme();
  const causa = getCausa(problema.causa_id);
  const cor = corDaCausa(theme, problema.causa_id);
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
  const temFoto = Boolean(problema.capa_url);
  const rotuloAbrir = [
    problema.titulo,
    causa.nome,
    local,
    `${total} de ${META_APOIOS} apoios`,
    temFoto ? null : 'Ainda sem foto',
  ]
    .filter(Boolean)
    .join('. ');

  const pulsar = () => {
    if (semMovimento) return;
    escala.setValue(1);
    Animated.sequence([
      Animated.spring(escala, { toValue: 1.15, useNativeDriver: true, speed: 40, bounciness: 10 }),
      Animated.spring(escala, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
  };

  const alternarApoio = () => {
    if (apoiado) {
      desapoiar.mutate();
      onApoioRetirado?.(() => apoiar.mutate());
      return;
    }
    pulsar();
    apoiar.mutate();
  };

  const botaoFundo = apoiado ? theme.colors.primaryContainer : theme.colors.secondary;
  const botaoTexto = apoiado ? theme.colors.onPrimaryContainer : theme.colors.onSecondary;

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]}>
      {temFoto ? (
        <Image
          source={{ uri: problema.capa_url! }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={styles.semFoto} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden aria-hidden>
          <MaterialCommunityIcons name={icone} size={96} color={comAlfa(cor.cor, 0.45)} />
        </View>
      )}

      {/* Alvo "abrir": cobre o cartão todo, por baixo do painel. */}
      <Pressable
        onPress={() => onPress(problema.id)}
        accessibilityRole="button"
        accessibilityLabel={rotuloAbrir}
        accessibilityHint="Abre os detalhes do problema"
        android_ripple={{ color: comAlfa(theme.colors.onVeu, 0.12) }}
        style={StyleSheet.absoluteFill}
      />

      <View
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
          aria-hidden
        accessibilityElementsHidden
        style={styles.topo}
      >
        <View style={[styles.selo, { backgroundColor: cor.cor }]}>
          <MaterialCommunityIcons name={icone} size={16} color={cor.sobre} />
          <Text style={[styles.seloTexto, { color: cor.sobre }]}>{causa.nome}</Text>
        </View>
        {problema.cont_imagens > 1 && (
          <View style={[styles.contador, { backgroundColor: theme.colors.veu }]}>
            <MaterialCommunityIcons name="image-multiple" size={16} color={theme.colors.onVeu} />
            <Text style={[styles.contadorTexto, { color: theme.colors.onVeu }]}>{problema.cont_imagens}</Text>
          </View>
        )}
      </View>

      <View pointerEvents="box-none" style={styles.painel}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.veu }]} />

        <View
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
          aria-hidden
          accessibilityElementsHidden
          style={styles.infos}
        >
          <Text style={[styles.titulo, { color: theme.colors.onVeu }]} numberOfLines={2}>
            {problema.titulo}
          </Text>

          {local !== '' && (
            <View style={styles.linha}>
              <MaterialCommunityIcons name="map-marker" size={16} color={theme.colors.onVeuSuave} />
              <Text style={[styles.sub, { color: theme.colors.onVeuSuave }]} numberOfLines={1}>
                {local}
              </Text>
            </View>
          )}

          {!temFoto && (
            <View style={styles.linha}>
              <MaterialCommunityIcons name="camera-plus" size={16} color={theme.colors.onVeuSuave} />
              <Text style={[styles.sub, { color: theme.colors.onVeuSuave }]}>
                Ainda sem foto. Quem apoia pode enviar uma.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.rodape}>
          <View
            pointerEvents="none"
            importantForAccessibility="no-hide-descendants"
          aria-hidden
            accessibilityElementsHidden
            style={styles.meta}
          >
            <View style={[styles.barra, { backgroundColor: comAlfa(theme.colors.onVeu, 0.25) }]}>
              <View
                style={[
                  styles.barraCheia,
                  { width: `${progressoMeta(total)}%`, backgroundColor: theme.colors.onVeu },
                ]}
              />
            </View>
            <Text style={[styles.sub, { color: theme.colors.onVeuSuave }]}>
              <Text style={[styles.forte, { color: theme.colors.onVeu }]}>{total}</Text> de {META_APOIOS} apoios
            </Text>
          </View>

          <Animated.View style={{ transform: [{ scale: escala }] }}>
            <Pressable
              onPress={alternarApoio}
              disabled={enviando}
              accessibilityRole="button"
              accessibilityLabel={apoiado ? `Você apoia ${problema.titulo}` : `Apoiar ${problema.titulo}`}
              accessibilityHint={apoiado ? 'Toque para retirar o apoio' : undefined}
              accessibilityState={{ selected: apoiado, busy: enviando }}
              android_ripple={{ color: comAlfa(botaoTexto, 0.16), borderless: false }}
              style={[styles.botao, { backgroundColor: botaoFundo, opacity: enviando ? 0.7 : 1 }]}
            >
              <MaterialCommunityIcons
                name={apoiado ? 'check-circle' : 'thumb-up'}
                size={18}
                color={botaoTexto}
              />
              <Text style={[styles.botaoTexto, { color: botaoTexto }]}>
                {apoiado ? 'Apoiando' : 'Apoiar'}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: ALTURA_MINIMA,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    paddingTop: 64,
  },
  semFoto: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    paddingTop: spacing.six,
  },
  topo: {
    position: 'absolute',
    top: spacing.two,
    left: spacing.two,
    right: spacing.two,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.half + 2,
    paddingVertical: 5,
    paddingLeft: 9,
    paddingRight: 12,
    borderRadius: 99,
  },
  seloTexto: { ...texto.rotulo },
  contador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.half,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 99,
  },
  contadorTexto: { ...texto.rotulo },
  painel: {
    margin: spacing.one,
    borderRadius: 14,
    overflow: 'hidden',
    paddingVertical: spacing.two,
    paddingLeft: spacing.three,
    paddingRight: spacing.two,
    gap: spacing.two,
  },
  infos: { gap: spacing.half + 2 },
  titulo: { ...texto.tituloSecao },
  linha: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.half + 2 },
  sub: { ...texto.meta, flexShrink: 1 },
  forte: { fontWeight: '700' },
  rodape: { flexDirection: 'row', alignItems: 'center', gap: spacing.three },
  meta: { flex: 1, minWidth: 0, gap: spacing.one },
  barra: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barraCheia: { height: '100%', borderRadius: 3 },
  botao: {
    minHeight: ALVO_MINIMO,
    minWidth: 112,
    paddingHorizontal: spacing.three + 2,
    borderRadius: ALVO_MINIMO / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.one,
    overflow: 'hidden',
  },
  botaoTexto: { ...texto.botao },
});
