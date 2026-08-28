import { Button as PaperButton } from 'react-native-paper';
import type { ButtonProps } from 'react-native-paper';

export function Button(props: ButtonProps) {
  return <PaperButton mode="contained" buttonColor="#2563eb" textColor="#fff" {...props} />;
}
