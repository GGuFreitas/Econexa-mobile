import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as Location from 'expo-location';
import { obterPosicao } from './useLocalizacao';

vi.mock('expo-location', () => ({
  Accuracy: { Balanced: 3 },
  getLastKnownPositionAsync: vi.fn(),
  getCurrentPositionAsync: vi.fn(),
  requestForegroundPermissionsAsync: vi.fn(),
}));

const ultima = vi.mocked(Location.getLastKnownPositionAsync);
const atual = vi.mocked(Location.getCurrentPositionAsync);
const posicao = (latitude: number) =>
  ({ coords: { latitude, longitude: -46.6 }, timestamp: 0 }) as Location.LocationObject;

describe('obterPosicao', () => {
  beforeEach(() => {
    ultima.mockReset();
    atual.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('usa a última posição conhecida sem esperar o GPS', async () => {
    ultima.mockResolvedValue(posicao(-23.1));

    expect(await obterPosicao()).toEqual(posicao(-23.1));
    expect(atual).not.toHaveBeenCalled();
  });

  it('sem última posição, pede a atual', async () => {
    ultima.mockResolvedValue(null);
    atual.mockResolvedValue(posicao(-23.2));

    expect(await obterPosicao()).toEqual(posicao(-23.2));
  });

  it('desiste depois do tempo limite em vez de girar para sempre', async () => {
    vi.useFakeTimers();
    ultima.mockResolvedValue(null);
    atual.mockReturnValue(new Promise(() => undefined));

    const resultado = obterPosicao(8000);
    await vi.advanceTimersByTimeAsync(8000);

    expect(await resultado).toBeNull();
  });

  it('erro ao ler a última posição não impede pedir a atual', async () => {
    ultima.mockRejectedValue(new Error('sem cache'));
    atual.mockResolvedValue(posicao(-23.3));

    expect(await obterPosicao()).toEqual(posicao(-23.3));
  });
});
