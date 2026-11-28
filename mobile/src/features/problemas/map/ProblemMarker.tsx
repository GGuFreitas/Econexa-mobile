import { Marker } from 'react-native-maps';
import { MarcadorVisual } from './MarcadorVisual';
import type { Problema } from '../types';

interface ProblemMarkerProps {
  problema: Problema;
  onPress: (problema: Problema) => void;
}

export function ProblemMarker({ problema, onPress }: ProblemMarkerProps) {
  return (
    <Marker
      coordinate={{ latitude: problema.lat, longitude: problema.lng }}
      onPress={() => onPress(problema)}
      tracksViewChanges={false}
    >
      <MarcadorVisual problema={problema} />
    </Marker>
  );
}
