import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextInput, Select, Button } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import type { CriarMobilizacaoInput } from '../types';

const schema = z.object({
  titulo: z.string().min(3, 'Mínimo 3 caracteres').max(120),
  descricao: z.string().max(2000).optional(),
  dataInicio: z.string().min(1, 'Informe a data de início.'),
  dataFim: z.string().optional(),
  localNome: z.string().max(120).optional(),
});

interface CriarMobilizacaoFormProps {
  problemaId: number;
  coordenada: { latitude: number; longitude: number };
  onSubmit: (payload: CriarMobilizacaoInput) => void;
  submitting: boolean;
}

export function CriarMobilizacaoForm({ problemaId, coordenada, onSubmit, submitting }: CriarMobilizacaoFormProps) {
  const theme = useAppTheme();
  const { control, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      titulo: '',
      descricao: '',
      dataInicio: new Date().toISOString().slice(0, 16),
      dataFim: '',
      localNome: '',
    },
  });

  const submit = (data: z.infer<typeof schema>) => {
    onSubmit({
      problemaId,
      usuarioId: 0, // será preenchido pelo backend via auth
      titulo: data.titulo,
      descricao: data.descricao || undefined,
      dataInicio: data.dataInicio,
      dataFim: data.dataFim || undefined,
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
        name="dataInicio"
        render={({ field }) => (
          <TextInput
            label="Data e hora de início"
            value={field.value}
            onChangeText={field.onChange}
            error={!!formState.errors.dataInicio}
            helperText={formState.errors.dataInicio?.message}
            placeholder="AAAA-MM-DDTHH:MM"
          />
        )}
      />

      <Controller
        control={control}
        name="dataFim"
        render={({ field }) => (
          <TextInput
            label="Data e hora de fim (opcional)"
            value={field.value}
            onChangeText={field.onChange}
            placeholder="AAAA-MM-DDTHH:MM"
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

      <View style={styles.dica}>
        <Text style={[styles.dicaText, { color: theme.colors.textSecondary }]}>
          A mobilização será vinculada a este problema.
        </Text>
      </View>

      <Button
        mode="contained"
        onPress={handleSubmit(submit)}
        loading={submitting}
        style={styles.submit}
      >
        Criar mobilização
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.four, gap: spacing.three },
  dica: { marginTop: spacing.two, padding: spacing.three, borderRadius: 8 },
  dicaText: { fontSize: typography.fontSize.xs },
  submit: { marginTop: spacing.two },
});