import { useNavigation, useRoute } from '@react-navigation/native';
import { Header, ScreenWrapper, LoadingSpinner, ErrorState } from '@shared/ui';
import { useLocalizacao } from '@shared/hooks/useLocalizacao';
import { useCriarMobilizacao } from '../hooks/useCriarMobilizacao';
import { CriarMobilizacaoForm } from '../components/CriarMobilizacaoForm';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '@navigation/AppNavigator';

interface RouteParams {
  problemaId: number;
}

export function CriarMobilizacaoScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CriarMobilizacao'>>();
  const { problemaId } = route.params;
  const { coordenada, carregando, erro } = useLocalizacao();
  const { mutate, isPending } = useCriarMobilizacao();

  if (erro) return <ErrorState message={erro} />;
  if (!coordenada) return <LoadingSpinner />;

  return (
    <ScreenWrapper>
      <Header title="Nova mobilização" onBack={() => navigation.goBack()} />
      <CriarMobilizacaoForm
        problemaId={problemaId}
        coordenada={coordenada}
        submitting={isPending}
        onSubmit={(payload) =>
          mutate(payload, { onSuccess: () => navigation.goBack() })
        }
      />
    </ScreenWrapper>
  );
}