import { Modal as PaperModal } from 'react-native-paper';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';

interface BottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  children: ReactNode;
}

export function BottomSheet({ visible, onDismiss, children }: BottomSheetProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <PaperModal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        padding: spacing.four,
        paddingTop: spacing.two,
        paddingBottom: spacing.four + insets.bottom,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        backgroundColor: theme.colors.surface,
      }}
    >
      <View
        importantForAccessibility="no"
        style={{
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: theme.colors.outlineStrong,
          opacity: 0.5,
          alignSelf: 'center',
          marginBottom: spacing.three,
        }}
      />
      {children}
    </PaperModal>
  );
}
