import { Button as PaperButton } from 'react-native-paper';
import type { ButtonProps } from 'react-native-paper';
import { useAppTheme } from '@shared/hooks/useAppTheme';

export function Button({ mode = 'contained', ...props }: ButtonProps) {
  const theme = useAppTheme();
  const preenchido = mode === 'contained';
  return (
    <PaperButton
      mode={mode}
      buttonColor={preenchido ? theme.colors.primary : undefined}
      textColor={preenchido ? theme.colors.onPrimary : theme.colors.primary}
      {...props}
    />
  );
}
