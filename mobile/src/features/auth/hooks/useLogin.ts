import { useMutation } from '@tanstack/react-query';
import { login, type LoginResponse } from '../api/login';
import { mapUser } from '../helpers/mapUser';
import { useAppDispatch } from '@store/hooks';
import { setCredentials } from '@store/authSlice';

type LoginInput = { email: string; password: string };

export function useLogin() {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (payload: LoginInput) => login(payload),
    onSuccess: (data: LoginResponse) => {
      dispatch(setCredentials({ user: mapUser(data.user), token: data.token }));
    },
  });
}
