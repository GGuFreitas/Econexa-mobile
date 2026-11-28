import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark';
/** 'system' segue o tema claro/escuro do aparelho. */
export type ThemePreference = ThemeMode | 'system';

export type ThemeState = {
  mode: ThemePreference;
};

const initialState: ThemeState = {
  mode: 'system',
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemePreference>) {
      state.mode = action.payload;
    },
    toggleTheme(state) {
      state.mode = state.mode === 'dark' ? 'light' : 'dark';
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;

/** Resolve a preferência para o tema que será desenhado. */
export function resolverTema(preferencia: ThemePreference, doSistema: string | null | undefined): ThemeMode {
  if (preferencia !== 'system') return preferencia;
  return doSistema === 'dark' ? 'dark' : 'light';
}

export default themeSlice.reducer;
