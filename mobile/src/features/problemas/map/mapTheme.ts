import { Platform } from 'react-native';
import type { ProblemPriority } from './markerConfig';

/** Tamanho do marker no mapa por prioridade (gramática visual: Prioridade = Tamanho). */
export const markerSizeByPriority: Record<ProblemPriority, number> = {
  critical: 46,
  high: 40,
  medium: 34,
  low: 28,
};

/** Largura do anel de mobilização (estado) ao redor do marker. */
export const markerRingWidth = 3;

/** Cores de estado (semântica) usadas no mapa. */
export const mapStateColors = {
  resolvido: '#2E7D32',
  emAnalise: '#F57F17',
  encaminhado: '#0277BD',
  ativo: '#9AA5B1',
  mobilizando: '#2E7D32',
};

/** Tokens de animação do mapa (spring). */
export const mapAnimation = {
  spring: { damping: 18, stiffness: 140 },
  ringPulseDuration: 1600,
};

/** Sombra padrão dos elementos flutuantes do mapa (FAB, bottom sheet handle). */
export const mapShadow = Platform.select({
  ios: {
    shadowColor: '#0A1F44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  android: { elevation: 6 },
  default: {},
});

export const mapZIndex = {
  marker: 10,
  cluster: 20,
  bottomSheet: 100,
  fab: 90,
  filterBar: 80,
};
