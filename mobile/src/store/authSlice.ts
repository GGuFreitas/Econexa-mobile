import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'specialist' | 'admin';
  vote_weight: number;
};

export type SituacaoDaSessao = 'restaurando' | 'autenticado' | 'anonimo' | 'erroDeRede';

export type MotivoDoEncerramento = 'CONTA_BLOQUEADA' | 'SESSAO_INVALIDA' | 'SESSAO_COMPROMETIDA';

export type Credenciais = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  situacao: SituacaoDaSessao;
  motivoDoEncerramento: MotivoDoEncerramento | null;
};

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  situacao: 'restaurando',
  motivoDoEncerramento: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<Credenciais>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.situacao = 'autenticado';
      state.motivoDoEncerramento = null;
    },
    restauracaoIniciada(state) {
      state.situacao = 'restaurando';
    },
    restauracaoFalhou(state, action: PayloadAction<{ refreshToken: string; user: User | null }>) {
      state.user = action.payload.user;
      state.accessToken = null;
      state.refreshToken = action.payload.refreshToken;
      state.situacao = 'erroDeRede';
    },
    logout(state, action: PayloadAction<MotivoDoEncerramento | undefined>) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.situacao = 'anonimo';
      state.motivoDoEncerramento = action.payload ?? null;
    },
  },
});

export const { setCredentials, restauracaoIniciada, restauracaoFalhou, logout } =
  authSlice.actions;

export default authSlice.reducer;
