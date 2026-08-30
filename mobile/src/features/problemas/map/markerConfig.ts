export type CausaId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type ProblemPriority = 'critical' | 'high' | 'medium' | 'low';

export interface CausaConfig {
  id: CausaId;
  nome: string;
  cor: string;
  icone: string;
  priority: ProblemPriority;
}

/**
 * Fonte única da verdade visual do mapa.
 * Valores de cor/icone espelham o seed do backend (tabela `causas`):
 * Mobilidade, Infraestrutura, Poluição, Desmatamento, Cultura, Segurança, Saúde, Educação.
 * `priority` define o tamanho do marker no mapa (gramática visual Mutira).
 */
export const causaConfig: Record<CausaId, CausaConfig> = {
  1: { id: 1, nome: 'Mobilidade', cor: '#3b82f6', icone: 'bus', priority: 'high' },
  2: { id: 2, nome: 'Infraestrutura', cor: '#f59e0b', icone: 'construction', priority: 'medium' },
  3: { id: 3, nome: 'Poluição', cor: '#10b981', icone: 'wind', priority: 'high' },
  4: { id: 4, nome: 'Desmatamento', cor: '#16a34a', icone: 'tree', priority: 'medium' },
  5: { id: 5, nome: 'Cultura', cor: '#a855f7', icone: 'palette', priority: 'low' },
  6: { id: 6, nome: 'Segurança', cor: '#ef4444', icone: 'shield', priority: 'high' },
  7: { id: 7, nome: 'Saúde', cor: '#ec4899', icone: 'heart', priority: 'critical' },
  8: { id: 8, nome: 'Educação', cor: '#6366f1', icone: 'book', priority: 'low' },
};

export const causaList: CausaConfig[] = Object.values(causaConfig);

export function getCausa(id: number): CausaConfig {
  return causaConfig[(id as CausaId)] ?? causaConfig[1];
}
