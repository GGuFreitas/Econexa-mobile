import { FAB as PaperFAB } from 'react-native-paper';
import type { FABProps } from 'react-native-paper';

/**
 * Botão flutuante. Sempre com nome para leitor de tela: use `label` (botão
 * estendido, preferível) ou `accessibilityLabel`.
 */
export function FAB(props: FABProps & { accessibilityLabel: string }) {
  return <PaperFAB {...props} />;
}
