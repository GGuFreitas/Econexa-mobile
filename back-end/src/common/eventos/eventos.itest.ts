import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { deslocarParaNorte } from '../../tests/integracao/banco.js';
import {
  criarEventoNoBanco,
  criarUsuario,
  encerrarBanco,
  limparBanco,
  SAO_PAULO,
} from '../../tests/integracao/fixtures.js';
import { listarEventos } from './eventos.handler.js';

describe('eventos: contrato espacial em metros', () => {
  let autor: number;

  beforeEach(async () => {
    await limparBanco();
    autor = await criarUsuario('Bruno Eventos');
  });

  afterAll(encerrarBanco);

  it('distancia_m do evento sai em metros', async () => {
    await criarEventoNoBanco(autor, deslocarParaNorte(SAO_PAULO.lat, 110), SAO_PAULO.lng, 'Perto');

    const [evento] = await listarEventos({
      lat: SAO_PAULO.lat,
      lng: SAO_PAULO.lng,
      raio: 5000,
    });

    expect(Number((evento as { distancia_m?: number }).distancia_m)).toBeGreaterThan(105);
    expect(Number((evento as { distancia_m?: number }).distancia_m)).toBeLessThan(115);
  });

  it('o raio do evento corta em metros: 110 m entra, 2 km fica de fora', async () => {
    await criarEventoNoBanco(autor, deslocarParaNorte(SAO_PAULO.lat, 110), SAO_PAULO.lng, 'Perto');
    await criarEventoNoBanco(autor, deslocarParaNorte(SAO_PAULO.lat, 2000), SAO_PAULO.lng, 'Longe');

    const dentro = await listarEventos({ lat: SAO_PAULO.lat, lng: SAO_PAULO.lng, raio: 500 });
    const ampliado = await listarEventos({ lat: SAO_PAULO.lat, lng: SAO_PAULO.lng, raio: 5000 });

    expect(dentro.map((evento) => evento.titulo)).toEqual(['Perto']);
    expect(ampliado).toHaveLength(2);
  });

  it('um evento no Recife não entra no raio de 5 km de São Paulo', async () => {
    await criarEventoNoBanco(autor, -8.0476, -34.877, 'Recife');

    const perto = await listarEventos({ lat: SAO_PAULO.lat, lng: SAO_PAULO.lng, raio: 5000 });

    expect(perto).toHaveLength(0);
  });
});
