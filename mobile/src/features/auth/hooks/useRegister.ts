import { useMutation } from '@tanstack/react-query';
import { register, type RegisterInput } from '../api/register';

export function useRegister() {
  return useMutation((payload: RegisterInput) => register(payload));
}
