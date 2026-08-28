import { TextInput as PaperInput } from 'react-native-paper';

export function TextInput(props: React.ComponentProps<typeof PaperInput>) {
  return <PaperInput mode="outlined" outlineColor="#cbd5e1" activeOutlineColor="#2563eb" {...props} />;
}
