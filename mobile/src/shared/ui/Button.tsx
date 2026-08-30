import { Button as PaperButton } from 'react-native-paper';
import type { ButtonProps } from 'react-native-paper';
import { useAppTheme } from '@shared/hooks/useAppTheme';

export function Button(props: ButtonProps) {
  const theme = useAppTheme();
  return (
    <PaperButton
      mode="contained"
      buttonColor={theme.colors.primary}
      textColor={theme.colors.onPrimary}
      {...props}
    />
  );
}
