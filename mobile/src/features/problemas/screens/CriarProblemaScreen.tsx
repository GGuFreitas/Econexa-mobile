import { useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { Header, ScreenWrapper, LoadingSpinner, ErrorState } from '@shared/ui';
import { useLocalizacao } from '@shared/hooks/useLocalizacao';
import { useCriarProblema } from '../hooks/useCriarProblema';
import { ProblemForm } from '../components/ProblemForm';
import { enviarEvidenciaProblema } from '../api/imagens';
import type { CriarProblemaPayload, UploadFileInput } from '../types';

export function CriarProblemaScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { coordenada, carregando, erro } = useLocalizacao();
  const { mutateAsync, isPending } = useCriarProblema();
  const [progressoUpload, setProgressoUpload] = useState<number | null>(null);

  if (erro) return <ErrorState message={erro} />;
  if (carregando || !coordenada) return <LoadingSpinner />;

  const handleSubmit = async (
    payload: CriarProblemaPayload,
    evidencia: UploadFileInput | null,
  ) => {
    try {
      const problema = await mutateAsync(payload);

      if (evidencia) {
        setProgressoUpload(0);
        try {
          await enviarEvidenciaProblema(problema.id, evidencia, setProgressoUpload);
          queryClient.invalidateQueries({ queryKey: ['imagens', 'problema', problema.id] });
          queryClient.invalidateQueries({ queryKey: ['eventos', problema.id] });
        } catch (falha) {
          Alert.alert(
            'Problema publicado sem a foto',
            (falha as Error).message ?? 'Não foi possível enviar a imagem.',
          );
        } finally {
          setProgressoUpload(null);
        }
      }

      navigation.goBack();
    } catch (falha) {
      Alert.alert('Não foi possível publicar', (falha as Error).message);
    }
  };

  return (
    <ScreenWrapper>
      <Header title="Relatar problema" onBack={() => navigation.goBack()} />
      <ProblemForm
        coordenada={coordenada}
        submitting={isPending || progressoUpload !== null}
        progressoUpload={progressoUpload}
        onSubmit={handleSubmit}
      />
    </ScreenWrapper>
  );
}
