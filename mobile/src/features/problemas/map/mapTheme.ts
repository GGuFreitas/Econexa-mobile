import { Platform } from 'react-native';
import type { ProblemPriority } from './markerConfig';

/** Tamanho do marcador segue a prioridade da categoria. */
export const markerSizeByPriority: Record<ProblemPriority, number> = {
  critical: 46,
  high: 40,
  medium: 34,
  low: 28,
};

/**
 * Sombra dos elementos que flutuam sobre o mapa. Sem cor própria: no iOS herda
 * `shadowColor` do tema onde é aplicada (ver `sombraDoMapa`); no Android usa elevação.
 */
export const mapShadow = Platform.select({
  ios: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  android: { elevation: 6 },
  default: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
});
