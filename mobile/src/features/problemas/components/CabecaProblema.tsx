import { Image, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { corDaCausa } from '@shared/theme/theme';
import { comAlfa } from '@shared/theme/alfa';
import { spacing } from '@shared/theme/spacing';
import { texto } from '@shared/theme/typography';
import { getCausa } from '../map/markerConfig';
import type { ProblemaDetalhe } from '../types';

type Icone = keyof typeof MaterialCommunityIcons.glyphMap;

interface CabecaProblemaProps {
  problema: ProblemaDetalhe;
  capaUrl: string | null;
}

/** Abre o Detalhe como o Feed: foto de ponta a ponta, categoria e título. */
export function CabecaProblema({ problema, capaUrl }: CabecaProblemaProps) {
  const theme = useAppTheme();
  const causa = getCausa(problema.causa_id);
  const cor = corDaCausa(theme, problema.causa_id);

  return (
    <View>
      <View style={[styles.capa, { backgroundColor: theme.colors.surfaceVariant }]}>
        {capaUrl ? (
          <Image
            source={{ uri: capaUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            accessibilityRole="image"
            accessibilityLabel={`Foto de ${problema.titulo}`}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.semFoto}>
            <MaterialCommunityIcons name={causa.icone as Icone} size={80} color={comAlfa(cor.cor, 0.45)} />
            <Text style={[styles.semFotoTexto, { color: theme.colors.onSurfaceVariant }]}>Ainda sem foto</Text>
          </View>
        )}
      </View>

      <View style={styles.textos}>
        <View style={[styles.selo, { backgroundColor: cor.cor }]}>
          <MaterialCommunityIcons name={causa.icone as Icone} size={16} color={cor.sobre} />
          <Text style={[styles.seloTexto, { color: cor.sobre }]}>{causa.nome}</Text>
        </View>
        <Text accessibilityRole="header" style={[styles.titulo, { color: theme.colors.onSurface }]}>
          {problema.titulo}
        </Text>
        {problema.local_nome && (
          <View style={styles.local}>
            <MaterialCommunityIcons name="map-marker-outline" size={18} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.localTexto, { color: theme.colors.onSurfaceVariant }]}>{problema.local_nome}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  capa: { height: 220, overflow: 'hidden' },
  semFoto: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.one },
  semFotoTexto: { ...texto.meta },
  textos: { paddingHorizontal: spacing.three, paddingTop: spacing.three, gap: spacing.one },
  selo: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.half + 2,
    paddingVertical: 5,
    paddingLeft: 9,
    paddingRight: 12,
    borderRadius: 99,
  },
  seloTexto: { ...texto.rotulo },
  titulo: { ...texto.titulo },
  local: { flexDirection: 'row', alignItems: 'center', gap: spacing.half },
  localTexto: { ...texto.corpo, flex: 1 },
});
