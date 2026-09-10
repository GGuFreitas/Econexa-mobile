import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { View, StyleSheet } from 'react-native';
import { Button } from '@shared/ui/Button';
import { TextInput } from '@shared/ui/TextInput';
import { spacing } from '@shared/theme/spacing';

const registerSchema = z
  .object({
    nome: z.string().min(2, 'Informe seu nome completo'),
    email: z.string().email('Digite um email válido'),
    password: z.string().min(6, 'A senha precisa ter ao menos 6 caracteres'),
    confirmacao: z.string(),
  })
  .refine((valores) => valores.password === valores.confirmacao, {
    path: ['confirmacao'],
    message: 'As senhas não conferem',
  });

export type RegisterFormValues = {
  nome: string;
  email: string;
  password: string;
  confirmacao: string;
};

interface RegisterFormProps {
  onSubmit: (valores: RegisterFormValues) => void | Promise<void>;
  submitting?: boolean;
}

export function RegisterForm({ onSubmit, submitting }: RegisterFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { nome: '', email: '', password: '', confirmacao: '' },
  });

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="nome"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            label="Nome completo"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={!!errors.nome}
            helperText={errors.nome?.message}
          />
        )}
      />

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

      <Controller
        control={control}
        name="confirmacao"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            label="Confirme a senha"
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
        loading={isSubmitting || submitting}
        style={styles.submit}
      >
        Criar conta
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.two },
  submit: { marginTop: spacing.two },
});
