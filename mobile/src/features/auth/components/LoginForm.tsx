import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { View, StyleSheet } from 'react-native';
import { Button } from '@shared/ui/Button';
import { TextInput } from '@shared/ui/TextInput';
import { spacing } from '@shared/theme/spacing';

const loginSchema = z.object({
  email: z.string().email('Digite um email válido'),
  password: z.string().min(6, 'A senha precisa ter ao menos 6 caracteres'),
});

export type LoginFormValues = {
  email: string;
  password: string;
};

interface LoginFormProps {
  onSubmit: (valores: LoginFormValues) => void | Promise<void>;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
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

      <Controller
        control={control}
        name="password"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            label="Senha"
            secureTextEntry
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
        )}
      />

      <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting} style={styles.submit}>
        Entrar
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.two },
  submit: { marginTop: spacing.two },
});
