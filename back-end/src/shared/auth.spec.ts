import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { dbPool } from '@config/database.js';
import { env } from '@config/env.js';
import { assinarAccessToken, optionalAuth, requireAuth } from './auth.js';

vi.mock('@config/database.js', () => ({
  dbPool: { query: vi.fn() },
}));

const mockQuery = dbPool.query as unknown as ReturnType<typeof vi.fn>;
const resposta = {} as FastifyReply;

function requisicao(authorization?: string): FastifyRequest {
  return { headers: authorization ? { authorization } : {} } as unknown as FastifyRequest;
}

function linhaDoBanco(extra: Record<string, unknown> = {}) {
  return {
    id: 7,
    email: 'ana@exemplo.invalid',
    role: 'citizen',
    bloqueado_em: null,
    sessao_versao: 2,
    ...extra,
  };
}

function base64url(valor: unknown): string {
  return Buffer.from(JSON.stringify(valor)).toString('base64url');
}

beforeEach(() => {
  mockQuery.mockReset();
  mockQuery.mockResolvedValue({ rows: [linhaDoBanco()] });
});

describe('requireAuth', () => {
  it('sem cabeçalho Bearer responde 401 sem consultar o banco', async () => {
    await expect(requireAuth(requisicao(), resposta)).rejects.toMatchObject({ statusCode: 401 });
    await expect(requireAuth(requisicao('Basic abc'), resposta)).rejects.toMatchObject({
      statusCode: 401,
    });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it.each([
    ['assinado com outro segredo', () => jwt.sign({ sub: 7, sv: 2 }, 'outro-segredo-de-teste-123')],
    ['assinado com outro algoritmo', () => jwt.sign({ sub: 7, sv: 2 }, env.JWT_SECRET, { algorithm: 'HS512' })],
    ['sem assinatura (alg none)', () => `${base64url({ alg: 'none', typ: 'JWT' })}.${base64url({ sub: 7, sv: 2 })}.`],
    ['expirado', () => jwt.sign({ sub: 7, sv: 2 }, env.JWT_SECRET, { expiresIn: -10 })],
    ['no formato antigo, sem sv', () => jwt.sign({ sub: 7, email: 'ana@exemplo.invalid', role: 'admin' }, env.JWT_SECRET)],
    ['com sub que não é número', () => jwt.sign({ sub: '7', sv: 2 }, env.JWT_SECRET)],
  ])('token %s responde 401 sem consultar o banco', async (_caso, gerar) => {
    await expect(requireAuth(requisicao(`Bearer ${gerar()}`), resposta)).rejects.toMatchObject({
      statusCode: 401,
    });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('versão de sessão defasada responde 401', async () => {
    await expect(
      requireAuth(requisicao(`Bearer ${assinarAccessToken(7, 1)}`), resposta),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('usuário que não existe mais responde 401', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    await expect(
      requireAuth(requisicao(`Bearer ${assinarAccessToken(7, 2)}`), resposta),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('conta bloqueada responde 403 CONTA_BLOQUEADA', async () => {
    mockQuery.mockResolvedValue({ rows: [linhaDoBanco({ bloqueado_em: new Date() })] });

    await expect(
      requireAuth(requisicao(`Bearer ${assinarAccessToken(7, 2)}`), resposta),
    ).rejects.toMatchObject({ statusCode: 403, code: 'CONTA_BLOQUEADA' });
  });

  it('o papel vem do banco, não do token', async () => {
    mockQuery.mockResolvedValue({
      rows: [linhaDoBanco({ role: 'admin' })],
    });
    const request = requisicao(`Bearer ${assinarAccessToken(7, 2)}`);

    await requireAuth(request, resposta);

    expect(request.user).toEqual({
      id: 7,
      email: 'ana@exemplo.invalid',
      role: 'admin',
    });
    expect(mockQuery).toHaveBeenCalledWith(
      'SELECT id, email, role, bloqueado_em, sessao_versao FROM users WHERE id = $1',
      [7],
    );
  });
});

describe('optionalAuth', () => {
  it('sem cabeçalho segue anônimo sem consultar o banco', async () => {
    const request = requisicao();

    await optionalAuth(request, resposta);

    expect(request.user).toBeUndefined();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('qualquer falha vira anônimo, inclusive conta bloqueada', async () => {
    const invalido = requisicao('Bearer lixo');
    await optionalAuth(invalido, resposta);
    expect(invalido.user).toBeUndefined();

    mockQuery.mockResolvedValue({ rows: [linhaDoBanco({ bloqueado_em: new Date() })] });
    const bloqueado = requisicao(`Bearer ${assinarAccessToken(7, 2)}`);
    await optionalAuth(bloqueado, resposta);
    expect(bloqueado.user).toBeUndefined();
  });

  it('token válido identifica o usuário', async () => {
    const request = requisicao(`Bearer ${assinarAccessToken(7, 2)}`);

    await optionalAuth(request, resposta);

    expect(request.user).toMatchObject({ id: 7, role: 'citizen' });
  });
});
