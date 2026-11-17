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
const TEMPO_LIMITE_MS = 8000;
const IDADE_MAXIMA_MS = 5 * 60 * 1000;

export async function obterPosicao(
  tempoLimiteMs = TEMPO_LIMITE_MS,
): Promise<Location.LocationObject | null> {
  const ultima = await Location.getLastKnownPositionAsync({ maxAge: IDADE_MAXIMA_MS }).catch(
    () => null,
  );
  if (ultima) return ultima;

  let temporizador: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<null>((resolver) => {
    temporizador = setTimeout(() => resolver(null), tempoLimiteMs);
  });
  try {
    return await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      limite,
    ]);
  } finally {
    clearTimeout(temporizador);
  }
}

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
        const posicao = await obterPosicao();
        if (!ativo) return;
        if (!posicao) {
          setState((s) => ({
            ...s,
            carregando: false,
            erro: 'Não conseguimos sua localização agora.',
          }));
          return;
        }
        setState({
          coordenada: {
            latitude: posicao.coords.latitude,
            longitude: posicao.coords.longitude,
          },
          carregando: false,
          erro: null,
          permissionNegada: false,
        });
      } catch {
        if (ativo) {
          setState((s) => ({
            ...s,
            carregando: false,
            erro: 'Não conseguimos sua localização agora.',
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
