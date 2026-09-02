import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextInput, Button } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';

const schema = z.object({
  descricao: z.string().min(10, 'Descreva o resultado (mínimo 10 caracteres).').max(2000),
  sacos: z.coerce.number().int().min(0).optional(),
  pessoas: z.coerce.number().int().min(0).optional(),
  horas: z.coerce.number().min(0).optional(),
});

interface ResultadoFormProps {
  onSubmit: (data: { descricao: string; metricas?: Record<string, number> }) => void;
  submitting: boolean;
  onCancel: () => void;
}

export function ResultadoForm({ onSubmit, submitting, onCancel }: ResultadoFormProps) {
  const theme = useAppTheme();
  const { control, handleSubmit, formState } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      descricao: '',
      sacos: undefined,
      pessoas: undefined,
      horas: undefined,
    },
  });

  const submit = (data: z.infer<typeof schema>) => {
    const metricas: Record<string, number> = {};
    if (data.sacos) metricas.sacos = data.sacos;
    if (data.pessoas) metricas.pessoas = data.pessoas;
    if (data.horas) metricas.horas = data.horas;

    onSubmit({
      descricao: data.descricao,
      metricas: Object.keys(metricas).length > 0 ? metricas : undefined,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Controller
        control={control}
        name="descricao"
        render={({ field }) => (
          <TextInput
            label="O que foi feito / resultado"
            value={field.value}
            onChangeText={field.onChange}
            multiline
            numberOfLines={5}
            error={!!formState.errors.descricao}
            helperText={formState.errors.descricao?.message}
          />
        )}
      />

      <View style={styles.metricsGrid}>
        <Controller
          control={control}
          name="sacos"
          render={({ field }) => (
            <TextInput
              label="Sacos recolhidos"
              value={String(field.value ?? '')}
              onChangeText={(v) => field.onChange(v ? parseInt(v, 10) : undefined)}
              keyboardType="numeric"
            />
          )}
        />
        <Controller
          control={control}
          name="pessoas"
          render={({ field }) => (
            <TextInput
              label="Pessoas participantes"
              value={String(field.value ?? '')}
              onChangeText={(v) => field.onChange(v ? parseInt(v, 10) : undefined)}
              keyboardType="numeric"
            />
          )}
        />
        <Controller
          control={control}
          name="horas"
          render={({ field }) => (
            <TextInput
              label="Horas de duração"
              value={String(field.value ?? '')}
              onChangeText={(v) => field.onChange(v ? parseFloat(v) : undefined)}
              keyboardType="decimal-pad"
            />
          )}
        />
      </View>

      <View style={styles.actions}>
        <Button mode="outlined" onPress={onCancel} style={{ flex: 1 }}>
          Cancelar
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit(submit)}
          loading={submitting}
          style={{ flex: 1 }}
        >
          Salvar resultado
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.four, gap: spacing.three },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.three },
  actions: { flexDirection: 'row', gap: spacing.three, marginTop: spacing.two },
});