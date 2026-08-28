import { Provider as ReduxProvider } from 'react-redux';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from '@store/store';
import { queryClient } from '@shared/hooks/useAppQueryClient';
import { paperTheme } from '@shared/theme/theme';
import AppNavigator from '@navigation/AppNavigator';

export default function App() {
  return (
    <ReduxProvider store={store}>
      <PaperProvider theme={paperTheme}>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
            <StatusBar style="auto" />
          </SafeAreaProvider>
        </QueryClientProvider>
      </PaperProvider>
    </ReduxProvider>
  );
}
