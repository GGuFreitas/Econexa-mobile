import { Marker } from 'react-native-maps';
import { ClusterVisual } from './ClusterVisual';
import type { Problema } from '../types';

interface ProblemClusterProps {
  pontos: Problema[];
  onPress: () => void;
}

export function ProblemCluster({ pontos, onPress }: ProblemClusterProps) {
  const primeira = pontos[0];

  return (
    <Marker
      coordinate={{ latitude: primeira.lat, longitude: primeira.lng }}
      onPress={onPress}
      tracksViewChanges={false}
    >
      <ClusterVisual pontos={pontos} />
    </Marker>
  );
}
