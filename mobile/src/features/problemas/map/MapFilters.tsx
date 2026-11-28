import { ScrollView, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Chip } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { corDaCausa } from '@shared/theme/theme';
import { spacing } from '@shared/theme/spacing';
import { causaList } from './markerConfig';

type Icone = keyof typeof MaterialCommunityIcons.glyphMap;

interface MapFiltersProps {
  ativo: number | null;
  onSelecionar: (causaId: number | null) => void;
}

/**
 * Filtro por categoria. O nome fica em tinta (legível) e a cor da categoria
 * vai só no ícone, na versão com contraste garantido do tema.
 */
export function MapFilters({ ativo, onSelecionar }: MapFiltersProps) {
  const theme = useAppTheme();

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Filtrar por categoria">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{
          alignItems: 'center',
          gap: spacing.one,
          paddingHorizontal: spacing.three,
          paddingVertical: spacing.one,
        }}
      >
        <Chip
          selected={ativo === null}
          onPress={() => onSelecionar(null)}
          accessibilityRole="radio"
          accessibilityState={{ checked: ativo === null }}
          icon={() => (
            <MaterialCommunityIcons
              name="view-grid-outline"
              size={18}
              color={ativo === null ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
            />
          )}
        >
          Todas
        </Chip>
        {causaList.map((causa) => {
          const selecionada = ativo === causa.id;
          const corIcone = selecionada ? theme.colors.onPrimary : corDaCausa(theme, causa.id).cor;
          return (
            <Chip
              key={causa.id}
              selected={selecionada}
              onPress={() => onSelecionar(selecionada ? null : causa.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selecionada }}
              icon={() => (
                <MaterialCommunityIcons name={causa.icone as Icone} size={18} color={corIcone} />
              )}
            >
              {causa.nome}
            </Chip>
          );
        })}
      </ScrollView>
    </View>
  );
}
