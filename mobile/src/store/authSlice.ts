import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'specialist' | 'admin';
  vote_weight: number;
};

export type AuthState = {
  user: User | null;
  token: string | null;
};

const initialState: AuthState = {
  user: null,
  token: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: User; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    logout(state) {
      state.user = null;
      state.token = null;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;

export default authSlice.reducer;
