import { Chip as PaperChip } from 'react-native-paper';
import type { ChipProps } from 'react-native-paper';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { texto } from '@shared/theme/typography';

/**
 * Chip de 40 de altura com `hitSlop` para chegar aos 48 de alvo.
 * Selecionado: Mata Atlântica com texto claro; normal: papel pardo com tinta.
 */
export function Chip({ selected, style, textStyle, ...props }: ChipProps) {
  const theme = useAppTheme();
  const interativo = Boolean(props.onPress);

  return (
    <PaperChip
      mode="flat"
      selected={selected}
      showSelectedCheck={false}
      selectedColor={selected ? theme.colors.onPrimary : theme.colors.onSurface}
      hitSlop={interativo ? { top: 4, bottom: 4, left: 2, right: 2 } : undefined}
      accessibilityState={interativo ? { selected: Boolean(selected) } : undefined}
      style={[
        {
          minHeight: 40,
          justifyContent: 'center',
          borderRadius: theme.roundness,
          backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceVariant,
        },
        style,
      ]}
      textStyle={[
        { ...texto.rotulo, fontSize: 14, color: selected ? theme.colors.onPrimary : theme.colors.onSurface },
        textStyle,
      ]}
      {...props}
    />
  );
}
