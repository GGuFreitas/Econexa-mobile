import { describe, expect, it } from 'vitest';
import { causaConfig, causaList, getCausa } from './markerConfig';

describe('markerConfig', () => {
  it('mapeia os 8 ids de causa do backend', () => {
    expect(causaList).toHaveLength(8);
    expect(Object.keys(causaConfig)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
  });

  it('espelha cor/icone do seed do backend', () => {
    expect(causaConfig[1]).toMatchObject({ nome: 'Mobilidade', cor: '#3b82f6', icone: 'bus' });
    expect(causaConfig[7]).toMatchObject({ nome: 'Saúde', cor: '#ec4899', icone: 'heart' });
  });

  it('getCausa retorna fallback para id desconhecido', () => {
    expect(getCausa(999).id).toBe(1);
    expect(getCausa(4).nome).toBe('Desmatamento');
  });
});
