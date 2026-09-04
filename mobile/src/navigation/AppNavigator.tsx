import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthGuard } from '@navigation/AuthGuard';
import RegisterScreen from '@features/auth/screens/RegisterScreen';
import HomeScreen from '@features/home/screens/HomeScreen';
import { CriarProblemaScreen } from '@features/problemas/screens/CriarProblemaScreen';
import { DetalheProblemaScreen } from '@features/problemas/screens/DetalheProblemaScreen';
import { FeedScreen } from '@features/problemas/screens/FeedScreen';
import { PerfilScreen } from '@features/problemas/screens/PerfilScreen';
import { CriarMobilizacaoScreen } from '@features/mobilizations/screens/CriarMobilizacaoScreen';
import { MobilizacaoDetailScreen } from '@features/mobilizations/screens/MobilizacaoDetailScreen';

export type RootStackParamList = {
  Main: undefined;
  Cadastro: undefined;
  CriarProblema: undefined;
  DetalheProblema: { id: number };
  CriarMobilizacao: { problemaId: number };
  MobilizacaoDetail: { id: number };
};

type TabParamList = {
  Mapa: undefined;
  Feed: undefined;
  Perfil: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

function MapaStack() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Mapa"
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map-marker-radius" color={color} size={size} />
          ),
        }}
      >
        {() => (
          <AuthGuard>
            <HomeScreen />
          </AuthGuard>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Feed"
        component={FeedGuarded}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="format-list-bulleted" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={PerfilGuarded}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function FeedGuarded() {
  return (
    <AuthGuard>
      <FeedScreen />
    </AuthGuard>
  );
}

function PerfilGuarded() {
  return (
    <AuthGuard>
      <PerfilScreen />
    </AuthGuard>
  );
}

function CriarGuarded() {
  return (
    <AuthGuard>
      <CriarProblemaScreen />
    </AuthGuard>
  );
}

function DetalheGuarded() {
  return (
    <AuthGuard>
      <DetalheProblemaScreen />
    </AuthGuard>
  );
}

function CriarMobilizacaoGuarded() {
  return (
    <AuthGuard>
      <CriarMobilizacaoScreen />
    </AuthGuard>
  );
}

function MobilizacaoDetailGuarded() {
  return (
    <AuthGuard>
      <MobilizacaoDetailScreen />
    </AuthGuard>
  );
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MapaStack} />
      <Stack.Screen name="Cadastro" component={RegisterScreen} />
      <Stack.Screen name="CriarProblema" component={CriarGuarded} />
      <Stack.Screen name="DetalheProblema" component={DetalheGuarded} />
      <Stack.Screen name="CriarMobilizacao" component={CriarMobilizacaoGuarded} />
      <Stack.Screen name="MobilizacaoDetail" component={MobilizacaoDetailGuarded} />
    </Stack.Navigator>
  );
}
