import { useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { Header, ScreenWrapper, LoadingSpinner, ErrorState } from '@shared/ui';
import { useLocalizacao } from '@shared/hooks/useLocalizacao';
import { useCriarProblema } from '../hooks/useCriarProblema';
import { ProblemForm } from '../components/ProblemForm';
import { enviarEvidenciaProblema } from '../api/imagens';
import type { CriarProblemaPayload, UploadFileInput } from '../types';
import type { RootStackParamList } from '@navigation/AppNavigator';

export function CriarProblemaScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const { coordenada, carregando, erro } = useLocalizacao();
  const { mutateAsync, isPending } = useCriarProblema();
  const [progressoUpload, setProgressoUpload] = useState<number | null>(null);

  if (erro) return <ErrorState message={erro} />;
  if (carregando || !coordenada) return <LoadingSpinner />;

  const abrirExistente = (problemaId: number) => {
    Alert.alert(
      'Já existe um registro aqui',
      'Encontramos um problema da mesma causa neste mesmo ponto. Em vez de criar uma duplicata, abrimos o registro existente: apoie para somar sua voz e poder adicionar sua foto como evidência.',
      [{ text: 'Ver o registro', onPress: () => navigation.navigate('DetalheProblema', { id: problemaId }) }],
    );
  };

  const handleSubmit = async (
    payload: CriarProblemaPayload,
    evidencia: UploadFileInput | null,
  ) => {
    try {
      const resultado = await mutateAsync(payload);

      if (!resultado.criado) {
        abrirExistente(resultado.problema.id);
        return;
      }

      if (evidencia) {
        setProgressoUpload(0);
        try {
          await enviarEvidenciaProblema(resultado.problema.id, evidencia, setProgressoUpload);
          queryClient.invalidateQueries({
            queryKey: ['imagens', 'problema', resultado.problema.id],
          });
          queryClient.invalidateQueries({ queryKey: ['eventos', resultado.problema.id] });
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
