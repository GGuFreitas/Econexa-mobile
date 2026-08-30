import { Modal as PaperModal } from 'react-native-paper';
import type { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';

interface BottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  children: ReactNode;
}

/**
 * Bottom sheet leve baseado no Modal do Paper.
 * Posicionado na base da tela, com cantos arredondados no topo.
 * (PR-M3 aprimora com gesture/drag.)
 */
export function BottomSheet({ visible, onDismiss, children }: BottomSheetProps) {
  const theme = useAppTheme();
  return (
    <PaperModal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.colors.surface },
      ]}
    >
      <View style={styles.handle} />
      {children}
    </PaperModal>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.four,
    paddingTop: spacing.two,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: spacing.three,
  },
});
