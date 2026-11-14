import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { View, StyleSheet } from 'react-native';
import { Button } from '@shared/ui/Button';
import { TextInput } from '@shared/ui/TextInput';
import { spacing } from '@shared/theme/spacing';
import { codigoSchema, novaSenhaSchema } from '../utils/validacao';

const redefinirSenhaSchema = z
  .object({
    codigo: codigoSchema,
    password: novaSenhaSchema,
    confirmacao: z.string(),
  })
  .refine((valores) => valores.password === valores.confirmacao, {
    path: ['confirmacao'],
    message: 'As senhas não conferem',
  });

export type RedefinirSenhaFormValues = {
  codigo: string;
  password: string;
  confirmacao: string;
};

type RedefinirSenhaFormProps = {
  onSubmit: (valores: RedefinirSenhaFormValues) => void | Promise<void>;
};

export function RedefinirSenhaForm({ onSubmit }: RedefinirSenhaFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RedefinirSenhaFormValues>({
    resolver: zodResolver(redefinirSenhaSchema),
    defaultValues: { codigo: '', password: '', confirmacao: '' },
  });

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="codigo"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            label="Código de 6 números"
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={!!errors.codigo}
            helperText={errors.codigo?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            label="Nova senha"
            secureTextEntry
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="confirmacao"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            label="Confirme a nova senha"
            secureTextEntry
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
        style={styles.submit}
      >
        Redefinir senha
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.two },
  submit: { marginTop: spacing.two },
});
