import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Header, ScreenWrapper, LoadingSpinner, ErrorState } from '@shared/ui';
import { useLocalizacao } from '@shared/hooks/useLocalizacao';
import { useCriarProblema } from '../hooks/useCriarProblema';
import { ProblemForm } from '../components/ProblemForm';
import { Alert } from 'react-native';
import type { CriarProblemaPayload } from '../types';

export function CriarProblemaScreen() {
  const navigation = useNavigation();
  const { coordenada, carregando, erro } = useLocalizacao();
  const { mutate, isPending } = useCriarProblema();
  const [uploadingImage, setUploadingImage] = useState(false);

  if (erro) return <ErrorState message={erro} />;
  if (!coordenada) return <LoadingSpinner />;

  const handleSubmit = async (payload: CriarProblemaPayload) => {
    // Create problem first (without images for now)
    const { imagens, ...payloadWithoutImages } = payload;

    mutate(payloadWithoutImages, {
      onSuccess: async (createdProblema) => {
        // If there are images to upload, upload them to the created problem
        if (imagens && imagens.length > 0) {
          try {
            for (const url of imagens) {
              // Note: The current upload expects a file, not a URL.
              // This is a limitation - we'd need to upload the actual file.
              // For now, we'll skip image association until backend supports it properly.
              console.log('Imagem a associar:', url, 'ao problema', createdProblema.id);
            }
          } catch (e) {
            console.error('Erro ao associar imagens:', e);
            Alert.alert('Aviso', 'Problema criado, mas falha ao associar imagens.');
          }
        }
        navigation.goBack();
      },
    });
  };

  if (erro) return <ErrorState message={erro} />;
  if (!coordenada) return <LoadingSpinner />;

  return (
    <ScreenWrapper>
      <Header title="Relatar problema" onBack={() => navigation.goBack()} />
      <ProblemForm
        coordenada={coordenada}
        submitting={isPending}
        onSubmit={handleSubmit}
      />
    </ScreenWrapper>
  );
}