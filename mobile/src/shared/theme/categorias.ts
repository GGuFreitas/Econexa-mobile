/**
 * Cores de exibição das 8 categorias (opção B do redesenho, aprovada em 22/11/2026).
 *
 * As cores "de identidade" de cada categoria continuam em `markerConfig.ts`
 * (espelham o seed do backend), mas várias delas falham em contraste sobre o
 * creme e com texto branco. Por isso a interface usa estas versões:
 * - claro: tons mais escuros da mesma família, com texto branco (≥ 5:1) e
 *   legíveis como ícone/texto sobre o creme (≥ 4.6:1);
 * - escuro: tons mais claros da mesma família, com texto escuro (≥ 6.3:1) e
 *   legíveis sobre o fundo escuro (≥ 5.8:1).
 * São cores de fora da paleta fixa, aceitas de propósito só para categoria.
 */
export type CorCategoria = {
  /** Fundo de selo/marcador e cor de ícone ou texto sobre fundo neutro. */
  cor: string;
  /** Texto e ícone desenhados sobre `cor`. */
  sobre: string;
};

const TEXTO_CLARO = '#FFFFFF';
const TEXTO_ESCURO = '#12100D'; // fundo do tema escuro (colors.ts)

export const categoriasClaro: Record<number, CorCategoria> = {
  1: { cor: '#1D4ED8', sobre: TEXTO_CLARO }, // Mobilidade
  2: { cor: '#B45309', sobre: TEXTO_CLARO }, // Infraestrutura
  3: { cor: '#047857', sobre: TEXTO_CLARO }, // Poluição
  4: { cor: '#15803D', sobre: TEXTO_CLARO }, // Desmatamento
  5: { cor: '#7E22CE', sobre: TEXTO_CLARO }, // Cultura
  6: { cor: '#B91C1C', sobre: TEXTO_CLARO }, // Segurança
  7: { cor: '#BE185D', sobre: TEXTO_CLARO }, // Saúde
  8: { cor: '#4338CA', sobre: TEXTO_CLARO }, // Educação
};

export const categoriasEscuro: Record<number, CorCategoria> = {
  1: { cor: '#60A5FA', sobre: TEXTO_ESCURO },
  2: { cor: '#FBBF24', sobre: TEXTO_ESCURO },
  3: { cor: '#34D399', sobre: TEXTO_ESCURO },
  4: { cor: '#4ADE80', sobre: TEXTO_ESCURO },
  5: { cor: '#C084FC', sobre: TEXTO_ESCURO },
  6: { cor: '#F87171', sobre: TEXTO_ESCURO },
  7: { cor: '#F472B6', sobre: TEXTO_ESCURO },
  8: { cor: '#818CF8', sobre: TEXTO_ESCURO },
};
