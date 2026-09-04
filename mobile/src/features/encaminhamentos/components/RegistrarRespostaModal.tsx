import { View, Text, StyleSheet } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Modal, TextInput } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { useRegistrarResposta } from '../hooks/useRegistrarResposta';
import type { Encaminhamento } from '../types';

const schema = z.object({
  resposta: z
    .string()
    .trim()
    .min(5, 'Descreva a resposta do órgão.')
    .max(4000, 'Máximo de 4000 caracteres.'),
  protocolo: z.string().trim().max(60, 'Máximo de 60 caracteres.').optional(),
});

type RespostaFormValues = z.infer<typeof schema>;

interface RegistrarRespostaModalProps {
  problemaId: number;
  encaminhamento: Encaminhamento | null;
  onFechar: () => void;
}

export function RegistrarRespostaModal({
  problemaId,
  encaminhamento,
  onFechar,
}: RegistrarRespostaModalProps) {
  const theme = useAppTheme();
  const registrar = useRegistrarResposta(problemaId);
  const { control, handleSubmit, reset, formState } = useForm<RespostaFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { resposta: '', protocolo: '' },
  });

  const fechar = () => {
    reset();
    registrar.reset();
    onFechar();
  };

  const submit = (valores: RespostaFormValues) => {
    if (!encaminhamento) return;
    registrar.mutate(
      {
        encaminhamentoId: encaminhamento.id,
        resposta: valores.resposta,
        protocolo: valores.protocolo || undefined,
      },
      { onSuccess: fechar },
    );
  };

  return (
    <Modal visible={encaminhamento !== null} onDismiss={fechar}>
      <View style={[styles.modal, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.titulo, { color: theme.colors.onSurface }]}>Registrar resposta</Text>
        {encaminhamento && (
          <Text style={[styles.subtitulo, { color: theme.colors.textSecondary }]}>
            {encaminhamento.orgao.nome} · {encaminhamento.referencia}
          </Text>
        )}

        <Controller
          control={control}
          name="resposta"
          render={({ field }) => (
            <TextInput
              label="O que o órgão respondeu"
              value={field.value}
              onChangeText={field.onChange}
              multiline
              numberOfLines={4}
              disabled={registrar.isPending}
              error={!!formState.errors.resposta}
              helperText={formState.errors.resposta?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="protocolo"
          render={({ field }) => (
            <TextInput
              label="Protocolo (opcional)"
              value={field.value}
              onChangeText={field.onChange}
              disabled={registrar.isPending}
              error={!!formState.errors.protocolo}
              helperText={formState.errors.protocolo?.message}
            />
          )}
        />

        {registrar.isError && (
          <Text style={[styles.erro, { color: theme.colors.error }]}>
            {(registrar.error as Error).message}
          </Text>
        )}

        <View style={styles.acoes}>
          <Button mode="outlined" onPress={fechar} disabled={registrar.isPending}>
            Cancelar
          </Button>
          <Button
            mode="contained"
            loading={registrar.isPending}
            disabled={registrar.isPending}
            onPress={handleSubmit(submit)}
          >
            Salvar resposta
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { margin: spacing.four, padding: spacing.four, borderRadius: 12, gap: spacing.two },
  titulo: { fontSize: typography.fontSize.lg, fontWeight: '700' },
  subtitulo: { fontSize: typography.fontSize.sm },
  erro: { fontSize: typography.fontSize.xs },
  acoes: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.two,
    marginTop: spacing.two,
  },
});
