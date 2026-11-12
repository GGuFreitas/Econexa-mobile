import axios from 'axios';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

type CorpoDeErro = { notification?: { msg?: string; code?: string } };

export function paraApiError(falha: unknown): ApiError {
  if (falha instanceof ApiError) return falha;
  if (axios.isAxiosError<CorpoDeErro>(falha)) {
    const notificacao = falha.response?.data?.notification;
    const msg = notificacao?.msg ?? falha.message ?? 'Erro de conexão.';
    return new ApiError(msg, falha.response?.status, notificacao?.code);
  }
  if (falha instanceof Error && falha.message) return new ApiError(falha.message);
  return new ApiError('Erro de conexão.');
}
