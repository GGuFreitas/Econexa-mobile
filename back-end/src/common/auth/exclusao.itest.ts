import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { dbPool } from '@config/database.js';
import {
  contadoresDoProblema,
  criarProblemaNoBanco,
  criarUsuario,
  encerrarBanco,
  limparBanco,
} from '../../tests/integracao/fixtures.js';
import { criarServidor } from '../../tests/integracao/servidor.js';

const EMAIL = 'clara.exclusao@exemplo.invalid';
const SENHA = 'senha-da-clara';

let app: FastifyInstance;
let origem = 0;

function novaOrigem(): string {
  origem += 1;
  return `10.9.0.${origem}`;
}

async function cadastrar() {
  const resposta = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    remoteAddress: novaOrigem(),
    payload: { nome: 'Clara Exclusão', email: EMAIL, password: SENHA },
  });
  expect(resposta.statusCode).toBe(201);
  return resposta.json() as { accessToken: string; refreshToken: string; user: { id: number } };
}

function excluir(accessToken: string, payload: Record<string, unknown>) {
  return app.inject({
    method: 'DELETE',
    url: '/api/auth/me',
    remoteAddress: novaOrigem(),
    headers: { authorization: `Bearer ${accessToken}` },
    payload,
  });
}

describe('exclusão de conta', () => {
  beforeAll(async () => {
    app = await criarServidor();
  });

  beforeEach(limparBanco);

  afterAll(async () => {
    await app.close();
    await encerrarBanco();
  });

  it('anonimiza a conta, derruba o acesso e preserva o que ela publicou', async () => {
    const sessao = await cadastrar();
    const usuarioId = sessao.user.id;
    const proprio = await criarProblemaNoBanco({ usuarioId, titulo: 'Poste apagado' });
    const outroAutor = await criarUsuario('Davi Autor');
    const apoiado = await criarProblemaNoBanco({ usuarioId: outroAutor });
    const apoio = await app.inject({
      method: 'POST',
      url: `/api/problemas/${apoiado}/apoios`,
      headers: { authorization: `Bearer ${sessao.accessToken}` },
    });
    expect(apoio.statusCode).toBe(200);
    const contadoresAntes = await contadoresDoProblema(apoiado);

    const resposta = await excluir(sessao.accessToken, { password: SENHA });

    expect(resposta.statusCode).toBe(204);
    const linha = await dbPool.query(
      'SELECT nome, email, senha, email_verificado, excluido_em FROM users WHERE id = $1',
      [usuarioId],
    );
    expect(linha.rows[0]).toMatchObject({
      nome: 'Conta excluída',
      email: `conta-excluida-${usuarioId}@excluida.mutira.invalid`,
      senha: null,
      email_verificado: false,
    });
    expect(linha.rows[0].excluido_em).not.toBeNull();
    const tokens = await dbPool.query('SELECT COUNT(*)::int AS total FROM refresh_tokens WHERE usuario_id = $1', [
      usuarioId,
    ]);
    expect(tokens.rows[0].total).toBe(0);

    const problema = await dbPool.query('SELECT usuario_id FROM problemas WHERE id = $1', [proprio]);
    expect(problema.rows[0].usuario_id).toBe(usuarioId);
    expect(await contadoresDoProblema(apoiado)).toEqual(contadoresAntes);

    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${sessao.accessToken}` },
    });
    expect(me.statusCode).toBe(401);

    const renovacao = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      remoteAddress: novaOrigem(),
      payload: { refreshToken: sessao.refreshToken },
    });
    expect(renovacao.statusCode).toBe(401);

    const login = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      remoteAddress: novaOrigem(),
      payload: { email: EMAIL, password: SENHA },
    });
    expect(login.statusCode).toBe(401);

    const novoCadastro = await cadastrar();
    expect(novoCadastro.user.id).not.toBe(usuarioId);
  });

  it('senha errada ou ausente não exclui nada', async () => {
    const sessao = await cadastrar();

    const errada = await excluir(sessao.accessToken, { password: 'outra-senha' });
    const ausente = await excluir(sessao.accessToken, {});

    expect(errada.statusCode).toBe(400);
    expect(errada.json().notification.code).toBe('SENHA_INCORRETA');
    expect(ausente.statusCode).toBe(400);
    const linha = await dbPool.query('SELECT nome, excluido_em FROM users WHERE id = $1', [sessao.user.id]);
    expect(linha.rows[0]).toEqual({ nome: 'Clara Exclusão', excluido_em: null });
  });
});
