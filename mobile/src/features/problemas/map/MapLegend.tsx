import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { causaList } from './markerConfig';

export function MapLegend() {
  const theme = useAppTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
      ]}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.three,
    paddingVertical: spacing.two,
    paddingHorizontal: spacing.three,
    borderTopWidth: 1,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  label: { fontSize: 12 },
});
