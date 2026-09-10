import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { encerrarBanco } from '../tests/integracao/fixtures.js';
import { criarServidor, tokenDe } from '../tests/integracao/servidor.js';

let app: FastifyInstance;

describe('superfície HTTP depois da remoção das rotas de bypass', () => {
  beforeAll(async () => {
    app = await criarServidor();
  });

  afterAll(async () => {
    await app.close();
    await encerrarBanco();
  });

  it('POST /imagens não existe mais', async () => {
    const resposta = await app.inject({
      method: 'POST',
      url: '/api/imagens',
      headers: { authorization: `Bearer ${tokenDe(1)}` },
      payload: {
        tipo_entidade: 'problema',
        entidade_id: 1,
        url: 'https://exemplo.invalid/foto.jpg',
      },
    });

    expect(resposta.statusCode).toBe(404);
  });

  it('o caminho legítimo de evidência continua registrado', async () => {
    const semToken = await app.inject({
      method: 'POST',
      url: '/api/imagens/upload/problema/1',
    });

    expect(semToken.statusCode).toBe(401);
  });

  it('a leitura de imagens por entidade continua pública', async () => {
    const resposta = await app.inject({ method: 'GET', url: '/api/imagens/problema/1' });

    expect(resposta.statusCode).toBe(200);
    expect(resposta.json()).toEqual([]);
  });

  it('o domínio eventos sumiu inteiro', async () => {
    const listagem = await app.inject({ method: 'GET', url: '/api/eventos' });
    const criacao = await app.inject({
      method: 'POST',
      url: '/api/eventos',
      headers: { authorization: `Bearer ${tokenDe(1)}` },
      payload: { titulo: 'Mutirão', causaId: 1, dataInicio: '2026-10-01T09:00:00Z' },
    });

    expect(listagem.statusCode).toBe(404);
    expect(criacao.statusCode).toBe(404);
  });

  it('não há mais como resolver problema alheio pelo vínculo de evento', async () => {
    const resposta = await app.inject({
      method: 'POST',
      url: '/api/eventos/1/problemas/1',
      headers: { authorization: `Bearer ${tokenDe(999)}` },
      payload: { resolveu: true },
    });

    expect(resposta.statusCode).toBe(404);
  });

  it('a timeline do problema continua respondendo em /problemas/:id/eventos', async () => {
    const resposta = await app.inject({ method: 'GET', url: '/api/problemas/999999/eventos' });

    expect(resposta.statusCode).toBe(404);
    expect(resposta.json().notification.msg).toBe('Problema não encontrado.');
  });
});
