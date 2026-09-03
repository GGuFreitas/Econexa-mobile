import { View, Text, Image, ScrollView, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Button, EmptyState, ErrorState, LoadingSpinner } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { useImagensProblema } from '../hooks/useImagensProblema';
import { useEnviarEvidencia } from '../hooks/useEnviarEvidencia';

interface EvidenciasProblemaProps {
  problemaId: number;
  podeAdicionar: boolean;
}

export function EvidenciasProblema({ problemaId, podeAdicionar }: EvidenciasProblemaProps) {
  const theme = useAppTheme();
  const imagens = useImagensProblema(problemaId);
  const enviar = useEnviarEvidencia(problemaId);

  const selecionarEEnviar = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissao.status !== 'granted') {
      Alert.alert('Permissão negada', 'Habilite o acesso à galeria nas configurações.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (resultado.canceled) return;

    const manipulada = await manipulateAsync(
      resultado.assets[0].uri,
      [{ resize: { width: 1024 } }],
      { compress: 0.7, format: SaveFormat.JPEG },
    );

    enviar.mutate({
      uri: manipulada.uri,
      name: `evidencia-${Date.now()}.jpg`,
      type: 'image/jpeg',
    });
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.titulo, { color: theme.colors.onSurface }]}>Evidências</Text>

      {imagens.isLoading && <LoadingSpinner size="small" />}

      {!imagens.isLoading && imagens.isError && (
        <ErrorState
          message={(imagens.error as Error).message}
          onRetry={() => {
            imagens.refetch();
          }}
        />
      )}

      {!imagens.isLoading && !imagens.isError && imagens.data?.length === 0 && (
        <EmptyState
          title="Nenhuma foto ainda"
          description="Fotos enviadas para este problema aparecem aqui."
        />
      )}

      {!imagens.isLoading && !imagens.isError && !!imagens.data?.length && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galeria}>
          {imagens.data.map((imagem) => (
            <Image key={imagem.id} source={{ uri: imagem.url }} style={styles.foto} />
          ))}
        </ScrollView>
      )}

      {enviar.progresso !== null && (
        <Text style={[styles.progresso, { color: theme.colors.primary }]}>
          Enviando imagem... {enviar.progresso}%
        </Text>
      )}

      {enviar.isError && (
        <Text style={[styles.erro, { color: theme.colors.error }]}>
          {(enviar.error as Error).message}
        </Text>
      )}

      {podeAdicionar && (
        <Button
          mode="outlined"
          icon="camera-plus-outline"
          onPress={selecionarEEnviar}
          loading={enviar.isPending}
          disabled={enviar.isPending}
          style={styles.acao}
        >
          Adicionar evidência
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.two },
  titulo: { fontSize: typography.fontSize.md, fontWeight: '700' },
  galeria: { gap: spacing.two },
  foto: { width: 132, height: 99, borderRadius: 8 },
  progresso: { fontSize: typography.fontSize.sm },
  erro: { fontSize: typography.fontSize.xs },
  acao: { alignSelf: 'flex-start' },
});
