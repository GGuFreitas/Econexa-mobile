import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { getCausa } from '@features/problemas/map/markerConfig';
import { rotuloStatus } from '@features/problemas/utils/status';
import { META_APOIOS } from '@features/problemas/utils/meta';
import type { ProblemaListado } from '@features/problemas/types';

type Icone = keyof typeof MaterialCommunityIcons.glyphMap;

interface GradeProblemasProps {
  problemas: ProblemaListado[];
  vazio: string;
  onAbrir: (id: number) => void;
}

export function GradeProblemas({ problemas, vazio, onAbrir }: GradeProblemasProps) {
  const theme = useAppTheme();

  if (problemas.length === 0) {
    return <Text style={[styles.vazio, { color: theme.colors.onSurfaceVariant }]}>{vazio}</Text>;
  }

  return (
    <View style={styles.grade}>
      {problemas.map((problema) => {
        const causa = getCausa(problema.causa_id);
        const status = rotuloStatus(problema.status);
        return (
          <Pressable
            key={problema.id}
            onPress={() => onAbrir(problema.id)}
            accessibilityRole="button"
            accessibilityLabel={`${problema.titulo}. ${status}. ${problema.cont_apoios} apoios.`}
            style={[styles.item, { backgroundColor: theme.colors.surface, shadowColor: theme.colors.shadow }]}
          >
            <View style={[styles.capa, { backgroundColor: causa.cor }]}>
              {problema.capa_url ? (
                <Image
                  source={{ uri: problema.capa_url }}
                  resizeMode="cover"
                  style={StyleSheet.absoluteFill}
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <MaterialCommunityIcons
                  name={causa.icone as Icone}
                  size={44}
                  color="rgba(255, 255, 255, 0.75)"
                />
              )}
              <Text style={styles.status}>{status}</Text>
            </View>
            <View style={styles.corpo}>
              <Text style={[styles.titulo, { color: theme.colors.onSurface }]} numberOfLines={2}>
                {problema.titulo}
              </Text>
              <View style={styles.linha}>
                <MaterialCommunityIcons name="account-group" size={14} color={causa.cor} />
                <Text style={[styles.apoios, { color: theme.colors.onSurfaceVariant }]}>
                  {problema.cont_apoios} de {META_APOIOS}
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
    paddingHorizontal: spacing.two,
    paddingTop: spacing.two,
  },
  item: {
    width: '48.4%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  capa: { aspectRatio: 4 / 3, alignItems: 'center', justifyContent: 'center' },
  status: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    color: '#FFFFFF',
    fontSize: typography.fontSize.xs,
    fontWeight: '700',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    overflow: 'hidden',
  },
  corpo: { padding: spacing.one + 2, gap: 4 },
  titulo: { fontSize: typography.fontSize.sm + 1, fontWeight: '700', lineHeight: 18 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  apoios: { fontSize: typography.fontSize.xs + 1 },
  vazio: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.four,
    paddingVertical: spacing.four,
  },
});
