import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';

interface HeaderProps {
  title: string;
  onBack?: () => void;
}

export function Header({ title, onBack }: HeaderProps) {
  const theme = useAppTheme();

  return (
    <View
      style={{
        width: '100%',
        paddingVertical: spacing.three,
        paddingHorizontal: spacing.four,
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.two,
      }}
    >
      {onBack && (
        <TouchableOpacity onPress={onBack} hitSlop={8}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onPrimary} />
        </TouchableOpacity>
      )}
      <Text style={{ color: theme.colors.onPrimary, fontSize: 20, fontWeight: '700' }}>
        {title}
      </Text>
    </View>
  );
}
