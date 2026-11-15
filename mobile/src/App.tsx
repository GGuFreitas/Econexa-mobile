import { useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Cardo_700Bold } from '@expo-google-fonts/cardo';
import { QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '@store/store';
import { useAppSelector } from '@store/hooks';
import { queryClient } from '@shared/hooks/useAppQueryClient';
import { restaurarSessao } from '@shared/sessao/sessao';
import { getAppTheme } from '@shared/theme/theme';
import { getNavigationTheme } from '@shared/theme/navigationTheme';
import AppNavigator from '@navigation/AppNavigator';
import { SessaoGuard } from '@navigation/SessaoGuard';

function ThemedApp() {
  const mode = useAppSelector((state) => state.theme.mode);
  const paperTheme = getAppTheme(mode);
  const navigationTheme = getNavigationTheme(paperTheme, mode === 'dark');
  useFonts({ Cardo_700Bold });

  useEffect(() => {
    restaurarSessao();
  }, []);

  return (
    <PaperProvider theme={paperTheme}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <SessaoGuard>
            <NavigationContainer theme={navigationTheme}>
              <AppNavigator />
            </NavigationContainer>
          </SessaoGuard>
          <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        </SafeAreaProvider>
      </QueryClientProvider>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <ReduxProvider store={store}>
      <ThemedApp />
    </ReduxProvider>
  );
}
