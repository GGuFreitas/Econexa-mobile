import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { EmptyState } from '@shared/ui';
import { spacing } from '@shared/theme/spacing';
import { texto } from '@shared/theme/typography';
import { corDaCausa } from '@shared/theme/theme';
import { comAlfa } from '@shared/theme/alfa';
import { getCausa } from '@features/problemas/map/markerConfig';
import { iconeStatus, rotuloStatus } from '@features/problemas/utils/status';
import { META_APOIOS } from '@features/problemas/utils/meta';
import type { ProblemaListado } from '@features/problemas/types';

type Icone = keyof typeof MaterialCommunityIcons.glyphMap;

interface GradeProblemasProps {
  problemas: ProblemaListado[];
  vazioTitulo: string;
  vazioDescricao: string;
  vazioAcao?: { rotulo: string; icone: string; onPress: () => void };
  onAbrir: (id: number) => void;
}

export function GradeProblemas({ problemas, vazioTitulo, vazioDescricao, vazioAcao, onAbrir }: GradeProblemasProps) {
  const theme = useAppTheme();

  if (problemas.length === 0) {
    return (
      <EmptyState
        compacto
        icon="map-marker-outline"
        title={vazioTitulo}
        description={vazioDescricao}
        acaoRotulo={vazioAcao?.rotulo}
        acaoIcone={vazioAcao?.icone}
        onAcao={vazioAcao?.onPress}
      />
    );
  }

  return (
    <View style={styles.grade}>
      {problemas.map((problema) => {
        const causa = getCausa(problema.causa_id);
        const cor = corDaCausa(theme, problema.causa_id);
        const status = rotuloStatus(problema.status);
        return (
          <Pressable
            key={problema.id}
            onPress={() => onAbrir(problema.id)}
            accessibilityRole="button"
            accessibilityLabel={`${problema.titulo}. ${causa.nome}. ${status}. ${problema.cont_apoios} de ${META_APOIOS} apoios.`}
            android_ripple={{ color: comAlfa(theme.colors.primary, 0.12) }}
            style={[styles.item, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
          >
            <View style={[styles.capa, { backgroundColor: theme.colors.surfaceVariant }]}>
              {problema.capa_url ? (
                <Image
                  source={{ uri: problema.capa_url }}
                  resizeMode="cover"
                  style={StyleSheet.absoluteFill}
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <MaterialCommunityIcons name={causa.icone as Icone} size={44} color={comAlfa(cor.cor, 0.5)} />
              )}
              <View style={[styles.status, { backgroundColor: theme.colors.veu }]}>
                <MaterialCommunityIcons name={iconeStatus(problema.status) as Icone} size={14} color={theme.colors.onVeu} />
                <Text style={[styles.statusTexto, { color: theme.colors.onVeu }]}>{status}</Text>
              </View>
            </View>
            <View style={styles.corpo}>
              <Text style={[styles.titulo, { color: theme.colors.onSurface }]} numberOfLines={3}>
                {problema.titulo}
              </Text>
              <View style={styles.linha}>
                <MaterialCommunityIcons name={causa.icone as Icone} size={16} color={cor.cor} />
                <Text style={[styles.apoios, { color: theme.colors.onSurfaceVariant }]}>
                  {problema.cont_apoios} de {META_APOIOS} apoios
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.two,
    paddingHorizontal: spacing.three,
    paddingTop: spacing.three,
  },
  item: {
    flexBasis: '46%',
    flexGrow: 1,
    maxWidth: '50%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  capa: { aspectRatio: 4 / 3, alignItems: 'center', justifyContent: 'center' },
  status: {
    position: 'absolute',
    left: spacing.one,
    bottom: spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.one,
    paddingVertical: 3,
    borderRadius: 99,
  },
  statusTexto: { ...texto.rotulo },
  corpo: { padding: spacing.two, gap: spacing.half },
  titulo: { ...texto.corpoForte, fontSize: 14, lineHeight: 19 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: spacing.half },
  apoios: { ...texto.meta },
});
