import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { colors, darkColors, type Palette } from './colors';

function mergeColors(palette: Palette) {
  return {
    ...MD3LightTheme.colors,
    primary: palette.primary.main,
    onPrimary: palette.primary.contrast,
    primaryContainer: palette.primary.container,
    onPrimaryContainer: palette.primary.dark,
    secondary: palette.secondary.main,
    onSecondary: palette.secondary.contrast,
    secondaryContainer: palette.secondary.container,
    onSecondaryContainer: palette.secondary.dark,
    tertiary: palette.tertiary.main,
    onTertiary: palette.tertiary.contrast,
    background: palette.background,
    onBackground: palette.text,
    surface: palette.surface,
    onSurface: palette.text,
    surfaceVariant: palette.surfaceVariant,
    onSurfaceVariant: palette.textSecondary,
    error: palette.error,
    onError: '#FFFFFF',
    success: palette.success,
    onSuccess: '#FFFFFF',
    warning: palette.warning,
    info: palette.info,
    outline: palette.border,
    outlineVariant: palette.divider,
    backdrop: palette.overlay,
    shadow: palette.shadow,
    text: palette.text,
    textSecondary: palette.textSecondary,
    textTertiary: palette.textTertiary,
    border: palette.border,
    placeholder: palette.textTertiary,
  };
}

export const lightTheme = {
  ...MD3LightTheme,
  colors: mergeColors(colors),
  roundness: 12,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: mergeColors(darkColors),
  roundness: 12,
};

export type AppTheme = typeof lightTheme;

export function getAppTheme(scheme: 'light' | 'dark'): AppTheme {
  return scheme === 'dark' ? darkTheme : lightTheme;
}
