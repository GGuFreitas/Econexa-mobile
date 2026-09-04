import { View } from 'react-native';
import { HelperText, TextInput as PaperInput } from 'react-native-paper';
import type { TextInputProps } from 'react-native-paper';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { estadoDoHelperText } from './helperText';

interface MutiraTextInputProps extends TextInputProps {
  helperText?: string;
}

export function TextInput({ helperText, ...props }: MutiraTextInputProps) {
  const theme = useAppTheme();
  const ajuda = estadoDoHelperText(helperText, props.error);

  return (
    <View>
      <PaperInput
        mode="outlined"
        outlineColor={theme.colors.outline}
        activeOutlineColor={theme.colors.primary}
        placeholderTextColor={theme.colors.placeholder}
        {...props}
      />
      {ajuda.visivel && (
        <HelperText type={ajuda.tipo} visible padding="none">
          {ajuda.texto}
        </HelperText>
      )}
    </View>
  );
}
