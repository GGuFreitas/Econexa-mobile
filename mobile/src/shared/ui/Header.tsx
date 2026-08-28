import { View, Text, TouchableOpacity } from 'react-native';
import { useAppDispatch } from '@store/hooks';
import { logout } from '@store/authSlice';

export function Header({ title }) {
  const dispatch = useAppDispatch();

  return (
    <View
      style={{
        width: '100%',
        paddingVertical: 16,
        paddingHorizontal: 24,
        backgroundColor: '#2563eb',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>{title}</Text>
      <TouchableOpacity
        onPress={() => dispatch(logout())}
        style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#1d4ed8', borderRadius: 8 }}
      >
        <Text style={{ color: '#fff', fontWeight: '600' }}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}
