import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { View, StyleSheet } from 'react-native';
import { Button } from '@shared/ui/Button';
import { TextInput } from '@shared/ui/TextInput';
import { useAppTheme } from '@shared/hooks/useAppTheme';
import { spacing } from '@shared/theme/spacing';

export const PALAVRA_DE_CONFIRMACAO = 'EXCLUIR';

const comSenhaSchema = z.object({ confirmacao: z.string().min(1, 'Digite sua senha') });

const semSenhaSchema = z.object({
  confirmacao: z
    .string()
    .trim()
    .refine((valor) => valor.toUpperCase() === PALAVRA_DE_CONFIRMACAO, {
      message: `Digite ${PALAVRA_DE_CONFIRMACAO} para confirmar`,
    }),
});

export type ExcluirContaFormValues = { confirmacao: string };

type ExcluirContaFormProps = {
  temSenha: boolean;
  onSubmit: (valores: ExcluirContaFormValues) => void | Promise<void>;
};

export function ExcluirContaForm({ temSenha, onSubmit }: ExcluirContaFormProps) {
  const theme = useAppTheme();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExcluirContaFormValues>({
    resolver: zodResolver(temSenha ? comSenhaSchema : semSenhaSchema),
    defaultValues: { confirmacao: '' },
  });

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="confirmacao"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            label={temSenha ? 'Sua senha' : `Digite ${PALAVRA_DE_CONFIRMACAO}`}
            secureTextEntry={temSenha}
            autoCapitalize={temSenha ? 'none' : 'characters'}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={!!errors.confirmacao}
            helperText={errors.confirmacao?.message}
          />
        )}
      />

      <Button
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
        disabled={isSubmitting}
        buttonColor={theme.colors.error}
        textColor={theme.colors.onError}
        icon="account-remove"
      >
        Excluir minha conta
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.three },
});
