import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { View, StyleSheet } from 'react-native';
import { Button } from '@shared/ui/Button';
import { TextInput } from '@shared/ui/TextInput';
import { spacing } from '@shared/theme/spacing';
import { emailSchema } from '../utils/validacao';

const esqueciSenhaSchema = z.object({ email: emailSchema });

export type EsqueciSenhaFormValues = { email: string };

type EsqueciSenhaFormProps = {
  onSubmit: (valores: EsqueciSenhaFormValues) => void | Promise<void>;
};

export function EsqueciSenhaForm({ onSubmit }: EsqueciSenhaFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EsqueciSenhaFormValues>({
    resolver: zodResolver(esqueciSenhaSchema),
    defaultValues: { email: '' },
  });

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="email"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
        )}
      />

      <Button
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
        disabled={isSubmitting}
        style={styles.submit}
      >
        Enviar código
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.two },
  submit: { marginTop: spacing.two },
});
