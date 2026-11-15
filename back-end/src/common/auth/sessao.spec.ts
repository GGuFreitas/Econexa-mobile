import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { dbPool } from '@config/database.js';
import { env } from '@config/env.js';
import { emTransacao } from '@shared/transacao.js';
import { emitirSessao, renovarSessao, revogarRefreshToken, revogarTodasAsSessoes } from './sessao.js';
import { hashDeSegredo } from './segredos.js';

vi.mock('@config/database.js', () => ({
  dbPool: { query: vi.fn() },
}));

vi.mock('@shared/transacao.js', async () => {
  const { dbPool: pool } = await import('@config/database.js');
  return {
    emTransacao: vi.fn((fn: (executor: unknown) => unknown) => fn({ query: pool.query })),
  };
});

type Regra = [trecho: string, linhas: (params: unknown[]) => unknown[]];

const mockQuery = dbPool.query as unknown as ReturnType<typeof vi.fn>;

function bancoFalso(...regras: Regra[]): void {
  mockQuery.mockImplementation(async (sql: string, params: unknown[] = []) => {
    const regra = regras.find(([trecho]) => sql.includes(trecho));
    return { rows: regra ? regra[1](params) : [] };
  });
}

function sqlsExecutados(): string[] {
  return mockQuery.mock.calls.map(([sql]) => String(sql));
}

function linhaUsuario(extra: Record<string, unknown> = {}) {
  return {
    id: 7,
    nome: 'Ana',
    email: 'ana@exemplo.invalid',
    role: 'citizen',
    peso_voto: 1,
    email_verificado: true,
    tem_senha: true,
    bloqueado_em: null,
    sessao_versao: 2,
    ...extra,
  };
}

const REVOGACAO_GERAL = ['UPDATE users SET sessao_versao', 'WHERE usuario_id = $1 AND revogado_em IS NULL'];

beforeEach(() => {
  mockQuery.mockReset();
  vi.mocked(emTransacao).mockClear();
});

describe('emitirSessao', () => {
  it('guarda só o hash do refresh token e assina a versão lida com o usuário travado', async () => {
    let paramsDoInsert: unknown[] = [];
    bancoFalso(['INSERT INTO refresh_tokens', (params) => {
      paramsDoInsert = params;
      return [{ id: 31, sessao_versao: 5 }];
    }]);

    const sessao = await emitirSessao(linhaUsuario({ sessao_versao: 4 }));

    expect(sessao.refreshToken).toMatch(/^[\w-]{64}$/);
    expect(paramsDoInsert).toEqual([7, hashDeSegredo(sessao.refreshToken), env.REFRESH_TOKEN_TTL_DAYS]);
    expect(sqlsExecutados()[0]).toContain('FOR UPDATE');
    expect(jwt.verify(sessao.accessToken, env.JWT_SECRET)).toMatchObject({ sub: 7, sv: 5 });
    expect(sessao).toMatchObject({ tokenType: 'Bearer', expiresIn: env.ACCESS_TOKEN_TTL_SECONDS });
    expect(sessao.user).toEqual({
      id: 7,
      name: 'Ana',
      email: 'ana@exemplo.invalid',
      role: 'citizen',
      vote_weight: 1,
      email_verified: true,
      has_password: true,
    });
  });
});

describe('renovarSessao', () => {
  it('rotaciona: trava o usuário, reivindica o token, grava o novo e liga o antigo a ele', async () => {
    bancoFalso(
      ['INSERT INTO refresh_tokens', () => [{ id: 41, sessao_versao: 2 }]],
      ['FOR UPDATE', () => [linhaUsuario()]],
      ['SET revogado_em = NOW()', () => [{ id: 40, usuario_id: 7 }]],
    );

    const sessao = await renovarSessao('refresh-antigo');

    const sqls = sqlsExecutados();
    expect(sqls[0]).toContain('WHERE id = (SELECT usuario_id FROM refresh_tokens WHERE token_hash = $1)');
    expect(sqls[1]).toContain('AND revogado_em IS NULL AND expira_em > NOW()');
    expect(sqls[2]).toContain('INSERT INTO refresh_tokens');
    expect(sqls[3]).toContain('SET substituido_por');
    expect(mockQuery.mock.calls[3][1]).toEqual([40, 41]);
    expect(mockQuery.mock.calls[0][1]).toEqual([hashDeSegredo('refresh-antigo')]);
    expect(sessao.refreshToken).not.toBe('refresh-antigo');
  });

  it('token desconhecido é SESSAO_INVALIDA e não revoga nada', async () => {
    bancoFalso();

    await expect(renovarSessao('desconhecido')).rejects.toMatchObject({
      statusCode: 401,
      code: 'SESSAO_INVALIDA',
    });
    for (const trecho of REVOGACAO_GERAL) {
      expect(sqlsExecutados().some((sql) => sql.includes(trecho))).toBe(false);
    }
  });

  it('token revogado com sucessor vivo é roubo: revoga tudo e responde SESSAO_COMPROMETIDA', async () => {
    bancoFalso(
      ['FOR UPDATE', () => [linhaUsuario()]],
      ['WITH RECURSIVE cadeia', () => [{ usuario_id: 7, viva: true }]],
      ['UPDATE users SET sessao_versao', () => [{ sessao_versao: 3 }]],
    );

    await expect(renovarSessao('rotacionado')).rejects.toMatchObject({
      statusCode: 401,
      code: 'SESSAO_COMPROMETIDA',
    });
    const sqls = sqlsExecutados();
    const versao = sqls.findIndex((sql) => sql.includes(REVOGACAO_GERAL[0]));
    const tokens = sqls.findIndex((sql) => sql.includes(REVOGACAO_GERAL[1]));
    expect(versao).toBeGreaterThan(-1);
    expect(tokens).toBeGreaterThan(versao);
  });

  it('token revogado sem nada vivo na cadeia é só SESSAO_INVALIDA', async () => {
    bancoFalso(
      ['FOR UPDATE', () => [linhaUsuario()]],
      ['WITH RECURSIVE cadeia', () => [{ usuario_id: 7, viva: false }]],
    );

    await expect(renovarSessao('morto')).rejects.toMatchObject({ code: 'SESSAO_INVALIDA' });
    expect(sqlsExecutados().some((sql) => sql.includes(REVOGACAO_GERAL[0]))).toBe(false);
  });

  it('conta bloqueada é 403 antes de reivindicar o token', async () => {
    bancoFalso(['FOR UPDATE', () => [linhaUsuario({ bloqueado_em: new Date() })]]);

    await expect(renovarSessao('de-bloqueada')).rejects.toMatchObject({
      statusCode: 403,
      code: 'CONTA_BLOQUEADA',
    });
    expect(sqlsExecutados().some((sql) => sql.includes('SET revogado_em = NOW()'))).toBe(false);
  });
});

describe('revogação', () => {
  it('revogarTodasAsSessoes sem executor abre a própria transação e trava o usuário antes dos tokens', async () => {
    bancoFalso(['UPDATE users SET sessao_versao', () => [{ sessao_versao: 9 }]]);

    expect(await revogarTodasAsSessoes(7)).toBe(9);
    expect(emTransacao).toHaveBeenCalledTimes(1);
    expect(sqlsExecutados()[0]).toContain(REVOGACAO_GERAL[0]);
    expect(sqlsExecutados()[1]).toContain(REVOGACAO_GERAL[1]);
  });

  it('revogarTodasAsSessoes com o pool no lugar da transação também abre uma', async () => {
    bancoFalso(['UPDATE users SET sessao_versao', () => [{ sessao_versao: 1 }]]);

    await revogarTodasAsSessoes(7, dbPool);

    expect(emTransacao).toHaveBeenCalledTimes(1);
  });

  it('revogarTodasAsSessoes de usuário inexistente devolve null', async () => {
    bancoFalso();

    expect(await revogarTodasAsSessoes(404)).toBeNull();
  });

  it('logout revoga pelo hash, nunca pelo token em claro', async () => {
    bancoFalso();

    await revogarRefreshToken('token-do-aparelho');

    expect(sqlsExecutados()[0]).toContain('WHERE token_hash = $1 AND revogado_em IS NULL');
    expect(mockQuery.mock.calls[0][1]).toEqual([hashDeSegredo('token-do-aparelho')]);
  });
});
