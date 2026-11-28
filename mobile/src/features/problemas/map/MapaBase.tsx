import { StyleSheet } from 'react-native';
import MapView from 'react-native-maps';
import { ProblemMarker } from './ProblemMarker';
import { ProblemCluster } from './ProblemCluster';
import type { MapaBaseProps } from './mapaBase.types';

export function MapaBase({
  regiaoInicial,
  regiao,
  onMudarRegiao,
  clusters,
  onSelecionar,
  onAproximar,
}: MapaBaseProps) {
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      initialRegion={regiaoInicial}
      region={regiao ?? undefined}
      onRegionChangeComplete={onMudarRegiao}
      showsUserLocation
      showsMyLocationButton={false}
    >
      {clusters.map((grupo) => {
        if (grupo.pontos.length === 1) {
          const p = grupo.pontos[0];
          return <ProblemMarker key={p.id} problema={p} onPress={onSelecionar} />;
        }
        return (
          <ProblemCluster key={grupo.id} pontos={grupo.pontos} onPress={() => onAproximar(grupo)} />
        );
      })}
    </MapView>
  );
}
