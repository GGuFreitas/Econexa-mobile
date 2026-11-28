import { describe, it, expect } from 'vitest';
import { categoriasClaro, categoriasEscuro } from './categorias';
import { colors, darkColors } from './colors';

function luminancia(hex: string): number {
  const canais = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = canais.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

const IDS = [1, 2, 3, 4, 5, 6, 7, 8];

describe('cores de categoria (WCAG AA)', () => {
  it('tem as 8 categorias nos dois temas', () => {
    expect(Object.keys(categoriasClaro).map(Number)).toEqual(IDS);
    expect(Object.keys(categoriasEscuro).map(Number)).toEqual(IDS);
  });

  it.each(IDS)('categoria %i: texto sobre a cor passa 4.5:1 no claro e no escuro', (id) => {
    expect(contraste(categoriasClaro[id].sobre, categoriasClaro[id].cor)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(categoriasEscuro[id].sobre, categoriasEscuro[id].cor)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(IDS)('categoria %i: ícone na cor passa 3:1 sobre fundo, folha e papel pardo', (id) => {
    for (const fundo of [colors.background, colors.surface, colors.surfaceVariant]) {
      expect(contraste(categoriasClaro[id].cor, fundo)).toBeGreaterThanOrEqual(3);
    }
    for (const fundo of [darkColors.background, darkColors.surface, darkColors.surfaceVariant]) {
      expect(contraste(categoriasEscuro[id].cor, fundo)).toBeGreaterThanOrEqual(3);
    }
  });
});
