import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { causaList } from './markerConfig';

export function MapLegend() {
  const theme = useAppTheme();
  return (
    <View
      style={[
        styles.rodape,
        { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outline },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.lista}
        contentContainerStyle={styles.container}
      >
        {causaList.map((causa) => (
          <View key={causa.id} style={styles.item}>
            <MaterialCommunityIcons
              name={causa.icone as keyof typeof MaterialCommunityIcons.glyphMap}
              size={16}
              color={causa.cor}
            />
            <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>{causa.nome}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rodape: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
  },
  lista: { flexGrow: 0 },
  container: {
    alignItems: 'center',
    gap: spacing.three,
    paddingVertical: spacing.two,
    paddingHorizontal: spacing.three,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  label: { fontSize: 12 },
});
