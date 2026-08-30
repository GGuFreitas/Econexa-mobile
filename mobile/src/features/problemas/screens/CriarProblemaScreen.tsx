import { useNavigation } from '@react-navigation/native';
import { Header, ScreenWrapper, LoadingSpinner, ErrorState } from '@shared/ui';
import { useLocalizacao } from '@shared/hooks/useLocalizacao';
import { useCriarProblema } from '../hooks/useCriarProblema';
import { ProblemForm } from '../components/ProblemForm';

export function CriarProblemaScreen() {
  const navigation = useNavigation();
  const { coordenada, carregando, erro } = useLocalizacao();
  const { mutate, isPending } = useCriarProblema();

  if (erro) return <ErrorState message={erro} />;
  if (!coordenada) return <LoadingSpinner />;

  return (
    <ScreenWrapper>
      <Header title="Relatar problema" onBack={() => navigation.goBack()} />
      <ProblemForm
        coordenada={coordenada}
        submitting={isPending}
        onSubmit={(payload) =>
          mutate(payload, { onSuccess: () => navigation.goBack() })
        }
      />
    </ScreenWrapper>
  );
}
