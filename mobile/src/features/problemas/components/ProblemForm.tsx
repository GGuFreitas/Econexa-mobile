import { useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, Alert } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { TextInput, Select, Button } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { causaList } from '../map/markerConfig';
import type { CriarProblemaPayload } from '../types';

const schema = z.object({
  titulo: z.string().min(3, 'Mínimo 3 caracteres').max(120),
  descricao: z.string().max(2000).optional(),
  causaId: z.number().int().positive('Escolha a causa.'),
  tipo: z.enum(['problema', 'ponto_positivo', 'cultural']),
  escopo: z.enum(['local', 'municipal', 'estadual', 'nacional']),
  localNome: z.string().max(120).optional(),
});

interface ProblemFormProps {
  coordenada: { latitude: number; longitude: number };
  onSubmit: (payload: CriarProblemaPayload) => void;
  submitting: boolean;
}

export function ProblemForm({ coordenada, onSubmit, submitting }: ProblemFormProps) {
  const theme = useAppTheme();
  const [foto, setFoto] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: '',
      descricao: '',
      causaId: 1,
      tipo: 'problema',
      escopo: 'local',
      localNome: '',
    },
  });

  const selecionarFoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
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
    const manipulado = await manipulateAsync(resultado.assets[0].uri, [
      { resize: { width: 1024 } },
    ], { compress: 0.7, format: SaveFormat.JPEG });
    setFoto(manipulado.uri);
  };

  const submit = (data: z.infer<typeof schema>) => {
    onSubmit({
      titulo: data.titulo,
      descricao: data.descricao || undefined,
      causaId: data.causaId,
      tipo: data.tipo,
      escopo: data.escopo,
      localNome: data.localNome || undefined,
      lat: coordenada.latitude,
      lng: coordenada.longitude,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Controller
        control={control}
        name="titulo"
        render={({ field }) => (
          <TextInput
            label="Título"
            value={field.value}
            onChangeText={field.onChange}
            error={!!formState.errors.titulo}
            helperText={formState.errors.titulo?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="descricao"
        render={({ field }) => (
          <TextInput
            label="Descrição (opcional)"
            value={field.value}
            onChangeText={field.onChange}
            multiline
            numberOfLines={4}
            error={!!formState.errors.descricao}
            helperText={formState.errors.descricao?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="causaId"
        render={({ field }) => (
          <Select
            label="Causa"
            value={field.value}
            onValueChange={field.onChange}
            options={causaList.map((c) => ({ label: c.nome, value: c.id }))}
          />
        )}
      />

      <Controller
        control={control}
        name="tipo"
        render={({ field }) => (
          <Select
            label="Tipo"
            value={field.value}
            onValueChange={field.onChange}
            options={[
              { label: 'Problema', value: 'problema' },
              { label: 'Ponto positivo', value: 'ponto_positivo' },
              { label: 'Cultural', value: 'cultural' },
            ]}
          />
        )}
      />

      <Controller
        control={control}
        name="escopo"
        render={({ field }) => (
          <Select
            label="Escopo"
            value={field.value}
            onValueChange={field.onChange}
            options={[
              { label: 'Local', value: 'local' },
              { label: 'Municipal', value: 'municipal' },
              { label: 'Estadual', value: 'estadual' },
              { label: 'Nacional', value: 'nacional' },
            ]}
          />
        )}
      />

      <Controller
        control={control}
        name="localNome"
        render={({ field }) => (
          <TextInput
            label="Local (opcional)"
            value={field.value}
            onChangeText={field.onChange}
            error={!!formState.errors.localNome}
            helperText={formState.errors.localNome?.message}
          />
        )}
      />

      <View style={styles.fotoBox}>
        <Button
          mode="outlined"
          icon="camera"
          onPress={selecionarFoto}
          style={{ alignSelf: 'flex-start' }}
        >
          {foto ? 'Trocar foto' : 'Adicionar foto'}
        </Button>
        {foto && (
          <View style={styles.fotoPreview}>
            <Image source={{ uri: foto }} style={styles.foto} />
            <MaterialCommunityIcons
              name="close-circle"
              size={24}
              color={theme.colors.error}
              onPress={() => setFoto(null)}
            />
          </View>
        )}
        <Text style={[styles.dica, { color: theme.colors.textSecondary }]}>
          Usando sua localização atual para posicionar o ponto no mapa.
        </Text>
      </View>

      <Button
        mode="contained"
        onPress={handleSubmit(submit)}
        loading={submitting}
        style={styles.submit}
      >
        Publicar
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.four, gap: spacing.three },
  fotoBox: { gap: spacing.two, marginBottom: spacing.two },
  fotoPreview: { flexDirection: 'row', alignItems: 'center', gap: spacing.two },
  foto: { width: 96, height: 72, borderRadius: 8 },
  dica: { fontSize: typography.fontSize.xs },
  submit: { marginTop: spacing.two },
});
