import { describe, it, expect } from 'vitest';
import { clusterizar } from './clusterUtils';
import type { Problema } from '../types';

function fake(id: number, lat: number, lng: number): Problema {
  return {
    id,
    usuario_id: 1,
    titulo: `P${id}`,
    descricao: null,
    causa_id: 1,
    tags: [],
    tipo: 'problema',
    status: 'ativo',
    local_nome: null,
    escopo: 'local',
    cont_apoios: 0,
    cont_apoios_ponderados: 0,
    cont_visualizacoes: 0,
    criado_em: '',
    atualizado_em: '',
    lat,
    lng,
  };
}

describe('clusterizar', () => {
  it('mantém pontos distantes em grupos separados', () => {
    const grupos = clusterizar([fake(1, -23.55, -46.63), fake(2, 0, 0)], 0.01);
    expect(grupos).toHaveLength(2);
  });

  it('agrupa pontos na mesma célula', () => {
    const grupos = clusterizar(
      [fake(1, -23.5501, -46.6301), fake(2, -23.5502, -46.6302)],
      0.01,
    );
    expect(grupos).toHaveLength(1);
    expect(grupos[0].pontos).toHaveLength(2);
  });

  it('retorna lista vazia para entrada vazia', () => {
    expect(clusterizar([], 0.01)).toEqual([]);
  });
});
