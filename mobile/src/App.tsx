import { Provider as ReduxProvider } from 'react-redux';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '@store/store';
import { useAppSelector } from '@store/hooks';
import { queryClient } from '@shared/hooks/useAppQueryClient';
import { getAppTheme } from '@shared/theme/theme';
import AppNavigator from '@navigation/AppNavigator';

function ThemedApp() {
  const mode = useAppSelector((state) => state.theme.mode);
  const paperTheme = getAppTheme(mode);

  return (
    <PaperProvider theme={paperTheme}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
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
