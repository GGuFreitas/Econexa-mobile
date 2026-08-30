import { View, Text, TouchableOpacity } from 'react-native';
import { useAppDispatch } from '@store/hooks';
import { logout } from '@store/authSlice';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';

export function Header({ title }: { title: string }) {
  const dispatch = useAppDispatch();
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
        justifyContent: 'space-between',
      }}
    >
      <Text style={{ color: theme.colors.onPrimary, fontSize: 20, fontWeight: '700' }}>
        {title}
      </Text>
      <TouchableOpacity
        onPress={() => dispatch(logout())}
        style={{
          paddingVertical: spacing.two,
          paddingHorizontal: spacing.three,
          backgroundColor: theme.colors.primaryContainer,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: theme.colors.onPrimaryContainer, fontWeight: '600' }}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}
