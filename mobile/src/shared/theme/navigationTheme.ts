import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import type { AppTheme } from './theme';

export function getNavigationTheme(appTheme: AppTheme, escuro: boolean): Theme {
  const base = escuro ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: escuro,
    colors: {
      ...base.colors,
      primary: appTheme.colors.primary,
      background: appTheme.colors.background,
      card: appTheme.colors.surface,
      text: appTheme.colors.onSurface,
      border: appTheme.colors.outline,
      notification: appTheme.colors.secondary,
    },
  };
}
