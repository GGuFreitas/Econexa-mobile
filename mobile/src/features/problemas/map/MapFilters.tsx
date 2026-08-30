import { ScrollView } from 'react-native';
import { Chip } from '@shared/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { causaList } from './markerConfig';

interface MapFiltersProps {
  ativo: number | null;
  onSelecionar: (causaId: number | null) => void;
}

export function MapFilters({ ativo, onSelecionar }: MapFiltersProps) {
  const theme = useAppTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: spacing.two, paddingHorizontal: spacing.three, paddingVertical: spacing.two }}
    >
      <Chip selected={ativo === null} onPress={() => onSelecionar(null)}>
        Todos
      </Chip>
      {causaList.map((causa) => (
        <Chip
          key={causa.id}
          selected={ativo === causa.id}
          onPress={() => onSelecionar(causa.id)}
          textStyle={{ color: ativo === causa.id ? theme.colors.onPrimary : causa.cor }}
          icon={() => (
            <MaterialCommunityIcons
              name={causa.icone as keyof typeof MaterialCommunityIcons.glyphMap}
              size={16}
              color={ativo === causa.id ? theme.colors.onPrimary : causa.cor}
            />
          )}
        >
          {causa.nome}
        </Chip>
      ))}
    </ScrollView>
  );
}
