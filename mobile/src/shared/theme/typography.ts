export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    marca: 'Cardo_700Bold',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    title: 30,
    display: 36,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.45,
    relaxed: 1.65,
  },
} as const;

export type Typography = typeof typography;

/**
 * Papéis de texto. Use estes em vez de escolher tamanho por tela.
 * Mínimo de 13 para qualquer texto que informe algo: o app é usado na rua, no sol.
 * Os tamanhos acompanham a fonte do sistema (allowFontScaling padrão do RN).
 */
export const texto = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '700' },
  titulo: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  tituloSecao: { fontSize: 17, lineHeight: 24, fontWeight: '700' },
  corpo: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  corpoForte: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  meta: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  rotulo: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  botao: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
  numero: { fontSize: 20, lineHeight: 24, fontWeight: '800' },
} as const;

/** Altura mínima de qualquer alvo de toque (padrão Android: 48dp). */
export const ALVO_MINIMO = 48;
