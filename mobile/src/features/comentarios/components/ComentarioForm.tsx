import { View, Text, StyleSheet } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextInput, Button } from '@shared/ui';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';
import { typography } from '@shared/theme/typography';
import { useCriarComentario } from '../hooks/useCriarComentario';

const schema = z.object({
  conteudo: z.string().trim().min(1, 'Escreva um comentário.').max(1000, 'Máximo de 1000 caracteres.'),
});

type ComentarioFormValues = z.infer<typeof schema>;

interface ComentarioFormProps {
  problemaId: number;
}

export function ComentarioForm({ problemaId }: ComentarioFormProps) {
  const theme = useAppTheme();
  const criar = useCriarComentario(problemaId);
  const { control, handleSubmit, reset, formState } = useForm<ComentarioFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { conteudo: '' },
  });

  const submit = (data: ComentarioFormValues) => {
    criar.mutate(data.conteudo, { onSuccess: () => reset() });
  };

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="conteudo"
        render={({ field }) => (
          <TextInput
            label="Escreva um comentário"
            value={field.value}
            onChangeText={field.onChange}
            multiline
            numberOfLines={3}
            disabled={criar.isPending}
            error={!!formState.errors.conteudo}
          />
        )}
      />
      {formState.errors.conteudo?.message && (
        <Text style={[styles.mensagem, { color: theme.colors.error }]}>
          {formState.errors.conteudo.message}
        </Text>
      )}
      {criar.isError && (
        <Text style={[styles.mensagem, { color: theme.colors.error }]}>
          {(criar.error as Error).message}
        </Text>
      )}
      <Button
        mode="contained"
        icon="send"
        loading={criar.isPending}
        disabled={criar.isPending}
        onPress={handleSubmit(submit)}
        style={styles.submit}
      >
        Comentar
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.two },
  mensagem: { fontSize: typography.fontSize.xs },
  submit: { alignSelf: 'flex-end' },
});
