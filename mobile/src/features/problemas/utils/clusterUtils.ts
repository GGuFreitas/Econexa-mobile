import type { Problema } from '../types';

export interface ClusterGrupo {
  id: string;
  coordenada: { latitude: number; longitude: number };
  pontos: Problema[];
}

/**
 * Clustering simples por grade (grid) baseado no delta visível do mapa.
 * Células maiores quando zoom está longe -> mais agrupamento.
 * Células menores quando zoom está perto -> pontos separados.
 */
export function clusterizar(problemas: Problema[], cellSizeGraus: number): ClusterGrupo[] {
  const celulas = new Map<string, ClusterGrupo>();

  for (const p of problemas) {
    const cellLat = Math.floor(p.lat / cellSizeGraus);
    const cellLng = Math.floor(p.lng / cellSizeGraus);
    const key = `${cellLat}:${cellLng}`;

    const existente = celulas.get(key);
    if (existente) {
      existente.pontos.push(p);
    } else {
      celulas.set(key, {
        id: key,
        coordenada: { latitude: p.lat, longitude: p.lng },
        pontos: [p],
      });
    }
  }

  return [...celulas.values()];
}
