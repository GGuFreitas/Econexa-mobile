import { TextInput as PaperInput } from 'react-native-paper';
import type { TextInputProps } from 'react-native-paper';
import { useAppTheme } from '@shared/hooks/useAppTheme';

export function TextInput(props: TextInputProps) {
  const theme = useAppTheme();
  return (
    <PaperInput
      mode="outlined"
      outlineColor={theme.colors.outline}
      activeOutlineColor={theme.colors.primary}
      placeholderTextColor={theme.colors.placeholder}
      {...props}
    />
  );
}
