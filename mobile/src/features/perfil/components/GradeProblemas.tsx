import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { getCausa } from '@features/problemas/map/markerConfig';
import { rotuloStatus } from '@features/problemas/utils/status';
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
            accessibilityLabel={`${problema.titulo}. ${status}.`}
            style={[styles.item, { backgroundColor: causa.cor }]}
          >
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
                size={34}
                color="rgba(255, 255, 255, 0.7)"
              />
            )}
            <Text style={styles.status}>{status}</Text>
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
    gap: 3,
    paddingHorizontal: spacing.two,
    paddingTop: spacing.one - 2,
  },
  item: {
    width: '32.6%',
    aspectRatio: 1,
    borderRadius: 6,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    color: '#FFFFFF',
    fontSize: typography.fontSize.xs - 1,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 99,
    overflow: 'hidden',
  },
  vazio: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.four,
    paddingVertical: spacing.four,
  },
});
