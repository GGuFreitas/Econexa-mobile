import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthGuard } from '@navigation/AuthGuard';
import HomeScreen from '@features/home/screens/HomeScreen';

function ProtectedHome() {
  return (
    <AuthGuard>
      <HomeScreen />
    </AuthGuard>
  );
}

export type RootStackParamList = {
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={ProtectedHome} />
    </Stack.Navigator>
  );
}
