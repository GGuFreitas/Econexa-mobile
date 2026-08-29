import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { Button } from '@shared/ui/Button';
import { TextInput } from '@shared/ui/TextInput';

const loginSchema = z.object({
  email: z.string().email('Digite um email válido'),
  password: z.string().min(6, 'A senha precisa ter ao menos 6 caracteres'),
});

export function LoginForm({ onSubmit }) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 24, marginBottom: 24 }}>Acessar Econexa</Text>

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
            style={{ marginBottom: 12 }}
          />
        )}
      />
      {errors.email && <Text style={{ color: '#b91c1c', marginBottom: 12 }}>{errors.email.message}</Text>}

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
            style={{ marginBottom: 12 }}
          />
        )}
      />
      {errors.password && <Text style={{ color: '#b91c1c', marginBottom: 12 }}>{errors.password.message}</Text>}

      <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting} style={{ marginTop: 16 }}>
        Entrar
      </Button>
    </View>
  );
}
