import { Button as PaperButton } from 'react-native-paper';
import type { ButtonProps } from 'react-native-paper';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { texto, ALVO_MINIMO } from '@shared/theme/typography';

/** Botão do Mutira: 48 de altura, cantos de 12, rótulo 15/700. */
export function Button({ mode = 'contained', contentStyle, labelStyle, style, ...props }: ButtonProps) {
  const theme = useAppTheme();
  const preenchido = mode === 'contained';
  const contornado = mode === 'outlined';

  return (
    <PaperButton
      mode={mode}
      buttonColor={preenchido ? theme.colors.primary : undefined}
      textColor={preenchido ? theme.colors.onPrimary : theme.colors.primary}
      contentStyle={[{ minHeight: ALVO_MINIMO, paddingHorizontal: 4 }, contentStyle]}
      labelStyle={[{ ...texto.botao, marginVertical: 0 }, labelStyle]}
      style={[
        { borderRadius: theme.roundness },
        contornado && { borderColor: theme.colors.outlineStrong },
        style,
      ]}
      {...props}
    />
  );
}
