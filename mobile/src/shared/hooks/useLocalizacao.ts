import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

export interface Coordenada {
  latitude: number;
  longitude: number;
}

interface LocalizacaoState {
  coordenada: Coordenada | null;
  carregando: boolean;
  erro: string | null;
  permissionNegada: boolean;
}

const SAO_PAULO: Coordenada = { latitude: -23.5505, longitude: -46.6333 };

export function useLocalizacao() {
  const [state, setState] = useState<LocalizacaoState>({
    coordenada: SAO_PAULO,
    carregando: true,
    erro: null,
    permissionNegada: false,
  });

  useEffect(() => {
    let ativo = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (ativo) {
            setState((s) => ({
              ...s,
              carregando: false,
              permissionNegada: true,
              erro: 'Permissão de localização negada.',
            }));
          }
          return;
        }
        const posicao = await Location.getCurrentPositionAsync({});
        if (ativo) {
          setState({
            coordenada: {
              latitude: posicao.coords.latitude,
              longitude: posicao.coords.longitude,
            },
            carregando: false,
            erro: null,
            permissionNegada: false,
          });
        }
      } catch (e) {
        if (ativo) {
          setState((s) => ({
            ...s,
            carregando: false,
            erro: e instanceof Error ? e.message : 'Erro de localização.',
          }));
        }
      }
    })();

    return () => {
      ativo = false;
    };
  }, []);

  return state;
}
