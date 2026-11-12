import { Platform } from 'react-native';
import type { ProblemPriority } from './markerConfig';

export const markerSizeByPriority: Record<ProblemPriority, number> = {
  critical: 46,
  high: 40,
  medium: 34,
  low: 28,
};

export const markerRingWidth = 3;

export const mapStateColors = {
  resolvido: '#2E7D32',
  emAnalise: '#F57F17',
  encaminhado: '#0277BD',
  ativo: '#9AA5B1',
  mobilizando: '#2E7D32',
};

export const mapAnimation = {
  spring: { damping: 18, stiffness: 140 },
  ringPulseDuration: 1600,
};

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
