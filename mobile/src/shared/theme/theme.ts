import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { colors, darkColors, type Palette } from './colors';
import { categoriasClaro, categoriasEscuro, type CorCategoria } from './categorias';
import { comAlfa } from './alfa';

type Base = typeof MD3LightTheme.colors;

/**
 * Monta as cores do tema só a partir da paleta fixa (colors.ts).
 * Todo papel do Material 3 que o React Native Paper usa é sobrescrito,
 * para nenhum tom padrão (o lilás do MD3) vazar para a interface.
 */
function mergeColors(
  palette: Palette,
  base: Base,
  oposta: Palette,
  categorias: Record<number, CorCategoria>,
) {
  return {
    ...base,
    primary: palette.primary.main,
    onPrimary: palette.primary.contrast,
    primaryContainer: palette.primary.container,
    onPrimaryContainer: oposta === darkColors ? palette.primary.dark : palette.primary.light,
    secondary: palette.secondary.main,
    onSecondary: palette.secondary.contrast,
    secondaryContainer: palette.secondary.container,
    onSecondaryContainer: oposta === darkColors ? palette.secondary.dark : palette.secondary.light,
    tertiary: palette.tertiary.main,
    onTertiary: palette.tertiary.contrast,
    tertiaryContainer: palette.surfaceVariant,
    onTertiaryContainer: palette.text,
    background: palette.background,
    onBackground: palette.text,
    surface: palette.surface,
    onSurface: palette.text,
    surfaceVariant: palette.surfaceVariant,
    onSurfaceVariant: palette.textSecondary,
    surfaceDisabled: comAlfa(palette.text, 0.12),
    onSurfaceDisabled: comAlfa(palette.text, 0.38),
    inverseSurface: palette.text,
    inverseOnSurface: palette.background,
    inversePrimary: oposta.primary.main,
    error: palette.error,
    // Texto sobre o erro: branco no claro; no escuro o erro é claro, então usa a tinta do tema claro.
    onError: oposta === darkColors ? colors.primary.contrast : oposta.text,
    errorContainer: palette.surfaceVariant,
    onErrorContainer: palette.error,
    success: palette.success,
    onSuccess: oposta === darkColors ? colors.primary.contrast : oposta.text,
    warning: palette.warning,
    info: palette.info,
    outline: palette.border,
    outlineVariant: palette.divider,
    backdrop: palette.overlay,
    shadow: palette.shadow,
    scrim: palette.shadow,
    // Elevação tonal feita com os tons de papel, sem o lilás padrão do MD3.
    elevation: {
      level0: 'transparent',
      level1: palette.surface,
      level2: palette.surface,
      level3: palette.surfaceVariant,
      level4: palette.surfaceVariant,
      level5: palette.surfaceVariant,
    },
    text: palette.text,
    textSecondary: palette.textSecondary,
    textTertiary: palette.textTertiary,
    border: palette.border,
    placeholder: palette.textTertiary,
    /**
     * Borda que delimita um controle (≥ 3:1). `border` é decorativa (1.3:1).
     * Derivada: tinta secundária, a mesma do texto de apoio.
     */
    outlineStrong: palette.textSecondary,
    /** Véu escuro de reserva sob texto branco em cima de foto (~5:1 no pior caso). */
    veu: comAlfa(colors.shadow, 0.64),
    /** Texto e ícones sobre o véu: sempre claros, nos dois temas. */
    onVeu: colors.primary.contrast,
    onVeuSuave: comAlfa(colors.primary.contrast, 0.9),
    categorias,
  };
}

export const lightTheme = {
  ...MD3LightTheme,
  colors: mergeColors(colors, MD3LightTheme.colors, darkColors, categoriasClaro),
  roundness: 12,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: mergeColors(darkColors, MD3DarkTheme.colors, colors, categoriasEscuro),
  roundness: 12,
};

export type AppTheme = typeof lightTheme;

export function getAppTheme(scheme: 'light' | 'dark'): AppTheme {
  return scheme === 'dark' ? darkTheme : lightTheme;
}

/** Cor de exibição da categoria no tema atual (com contraste garantido). */
export function corDaCausa(theme: AppTheme, causaId: number): CorCategoria {
  return theme.colors.categorias[causaId] ?? theme.colors.categorias[1];
}
