import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { dbPool } from '@config/database.js';
import { encerrarBanco, limparBanco } from '../../tests/integracao/fixtures.js';
import { criarServidor } from '../../tests/integracao/servidor.js';
import { registerUser } from './auth.handler.js';

const LIMITE_CADASTRO = 5;
const LIMITE_LOGIN = 10;

let app: FastifyInstance;

describe('cadastro e login', () => {
  beforeAll(async () => {
    app = await criarServidor();
  });

  beforeEach(limparBanco);

  afterAll(async () => {
    await app.close();
    await encerrarBanco();
  });

  it('cadastro pedindo specialist cria um citizen', async () => {
    const resposta = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      remoteAddress: '10.0.0.1',
      payload: {
        nome: 'Ana Escalada',
        email: 'ana.escalada@exemplo.invalid',
        password: 'senha123',
        role: 'specialist',
      },
    });

    expect(resposta.statusCode).toBe(201);
    expect(resposta.json().user.role).toBe('citizen');

    const linha = await dbPool.query('SELECT role FROM users WHERE email = $1', [
      'ana.escalada@exemplo.invalid',
    ]);
    expect(linha.rows[0].role).toBe('citizen');
  });

  it('cadastro pedindo admin também cria um citizen', async () => {
    const resposta = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      remoteAddress: '10.0.0.2',
      payload: {
        nome: 'Beto Escalada',
        email: 'beto.escalada@exemplo.invalid',
        password: 'senha123',
        role: 'admin',
      },
    });

    expect(resposta.statusCode).toBe(201);
    expect(resposta.json().user.role).toBe('citizen');
  });

  it('o cadastro passa a recusar depois do limite por origem', async () => {
    const aceitos: number[] = [];
    for (let tentativa = 0; tentativa < LIMITE_CADASTRO; tentativa += 1) {
      const resposta = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        remoteAddress: '10.0.0.3',
        payload: {
          nome: `Bruta Força ${tentativa}`,
          email: `bruta.forca.${tentativa}@exemplo.invalid`,
          password: 'senha123',
        },
      });
      aceitos.push(resposta.statusCode);
    }

    const excedente = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      remoteAddress: '10.0.0.3',
      payload: {
        nome: 'Bruta Força extra',
        email: 'bruta.forca.extra@exemplo.invalid',
        password: 'senha123',
      },
    });

    expect(aceitos).toEqual(Array(LIMITE_CADASTRO).fill(201));
    expect(excedente.statusCode).toBe(429);
  });

  it('o login passa a recusar depois do limite por origem', async () => {
    await registerUser({
      nome: 'Clara Alvo',
      email: 'clara.alvo@exemplo.invalid',
      password: 'senha123',
    });

    const recusas: number[] = [];
    for (let tentativa = 0; tentativa < LIMITE_LOGIN; tentativa += 1) {
      const resposta = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        remoteAddress: '10.0.0.4',
        payload: { email: 'clara.alvo@exemplo.invalid', password: 'senha-errada' },
      });
      recusas.push(resposta.statusCode);
    }

    const excedente = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      remoteAddress: '10.0.0.4',
      payload: { email: 'clara.alvo@exemplo.invalid', password: 'senha123' },
    });

    expect(recusas).toEqual(Array(LIMITE_LOGIN).fill(401));
    expect(excedente.statusCode).toBe(429);
  });
});
