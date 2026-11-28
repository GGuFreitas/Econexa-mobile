import type { ClusterGrupo } from '../utils/clusterUtils';
import type { Problema } from '../types';

export interface Regiao {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapaBaseProps {
  regiaoInicial: Regiao;
  regiao: Regiao | null;
  onMudarRegiao: (regiao: Regiao) => void;
  clusters: ClusterGrupo[];
  onSelecionar: (problema: Problema) => void;
  onAproximar: (grupo: ClusterGrupo) => void;
}
