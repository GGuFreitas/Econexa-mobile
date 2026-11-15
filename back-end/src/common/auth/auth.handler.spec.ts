import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { hash, verify } from '@node-rs/argon2';
import jwt from 'jsonwebtoken';
import { dbPool } from '@config/database.js';
import { env } from '@config/env.js';
import { cadastrarUsuario, entrarComSenha } from './auth.handler.js';

vi.mock('@config/database.js', () => ({
  dbPool: { query: vi.fn() },
}));

vi.mock('@shared/transacao.js', async () => {
  const { dbPool: pool } = await import('@config/database.js');
  return { emTransacao: (fn: (executor: unknown) => unknown) => fn(pool) };
});

vi.mock('@node-rs/argon2', async (importOriginal) => {
  const real = await importOriginal<typeof import('@node-rs/argon2')>();
  return { ...real, hash: vi.fn(real.hash), verify: vi.fn(real.verify) };
});

type Regra = [trecho: string, linhas: (params: unknown[]) => unknown[]];

const mockQuery = dbPool.query as unknown as ReturnType<typeof vi.fn>;
const mockHash = vi.mocked(hash);
const mockVerify = vi.mocked(verify);

function bancoFalso(...regras: Regra[]): void {
  mockQuery.mockImplementation(async (sql: string, params: unknown[] = []) => {
    const regra = regras.find(([trecho]) => sql.includes(trecho));
    return { rows: regra ? regra[1](params) : [] };
  });
}

function consultasCom(trecho: string): unknown[][] {
  return mockQuery.mock.calls.filter(([sql]) => String(sql).includes(trecho));
}

function linhaUsuario(extra: Record<string, unknown> = {}) {
  return {
    id: 7,
    nome: 'Ana',
    email: 'ana@exemplo.invalid',
    role: 'citizen',
    peso_voto: 1,
    bloqueado_em: null,
    sessao_versao: 0,
    ...extra,
  };
}

async function erroDe(promessa: Promise<unknown>): Promise<Record<string, unknown>> {
  try {
    await promessa;
  } catch (erro) {
    const { statusCode, message, code } = erro as Record<string, unknown>;
    return { statusCode, message, code };
  }
  throw new Error('A promessa deveria ter falhado.');
}

beforeEach(() => {
  mockQuery.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('tempo constante do login', () => {
  it('sem conta, paga um verify argon2 contra um hash fictício calculado uma vez e reaproveitado', async () => {
    bancoFalso();
    const hashesAntes = mockHash.mock.calls.length;
    const verifiesAntes = mockVerify.mock.calls.length;

    await expect(
      entrarComSenha({ email: 'ninguem@exemplo.invalid', password: 'qualquer' }),
    ).rejects.toMatchObject({ statusCode: 401 });
    await expect(
      entrarComSenha({ email: 'outro@exemplo.invalid', password: 'qualquer' }),
    ).rejects.toMatchObject({ statusCode: 401 });

    expect(mockHash.mock.calls.length - hashesAntes).toBe(1);
    expect(mockVerify.mock.calls.length - verifiesAntes).toBe(2);
  });
});

describe('cadastro', () => {
  it('cria citizen com a senha em argon2 e devolve sessão', async () => {
    let paramsDoUsuario: unknown[] = [];
    bancoFalso(
      ['INSERT INTO users', (params) => {
        paramsDoUsuario = params;
        return [linhaUsuario()];
      }],
      ['INSERT INTO refresh_tokens', () => [{ id: 1, sessao_versao: 0 }]],
    );

    const sessao = await cadastrarUsuario({
      nome: '  Ana  ',
      email: 'Ana@Exemplo.Invalid',
      password: 'senha-forte',
    });

    expect(String(consultasCom('INSERT INTO users')[0][0])).toContain("'citizen'");
    expect(paramsDoUsuario.slice(0, 2)).toEqual(['Ana', 'ana@exemplo.invalid']);
    expect(String(paramsDoUsuario[2])).toMatch(/^\$argon2id\$/);
    expect(sessao).toMatchObject({ tokenType: 'Bearer', expiresIn: env.ACCESS_TOKEN_TTL_SECONDS });
    expect(sessao.user).toMatchObject({ role: 'citizen' });
  });

  it('e-mail já cadastrado responde 409 sem gravar nada', async () => {
    bancoFalso(['FROM users WHERE email', () => [linhaUsuario()]]);

    await expect(
      cadastrarUsuario({ nome: 'Ana', email: 'ana@exemplo.invalid', password: 'senha-forte' }),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(consultasCom('INSERT')).toHaveLength(0);
  });

  it('a corrida entre dois cadastros vira 409, não 500', async () => {
    bancoFalso(['INSERT INTO users', () => {
      throw Object.assign(new Error('duplicate key'), { code: '23505' });
    }]);

    await expect(
      cadastrarUsuario({ nome: 'Ana', email: 'ana@exemplo.invalid', password: 'senha-forte' }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe('login', () => {
  let hashDaSenha: string;

  beforeAll(async () => {
    hashDaSenha = await hash('senha-certa');
  });

  function credenciais(extra: Record<string, unknown> = {}) {
    return [{ ...linhaUsuario(), senha: hashDaSenha, ...extra }];
  }

  it('entra com a senha certa e assina só sub e sv, em HS256', async () => {
    bancoFalso(
      ['senha FROM users WHERE email', () => credenciais({ sessao_versao: 3 })],
      ['INSERT INTO refresh_tokens', () => [{ id: 1, sessao_versao: 3 }]],
    );

    const sessao = await entrarComSenha({ email: 'ANA@exemplo.invalid', password: 'senha-certa' });

    expect(consultasCom('senha FROM users WHERE email')[0][1]).toEqual(['ana@exemplo.invalid']);
    const cabecalho = jwt.decode(sessao.accessToken, { complete: true })!.header;
    const declaracoes = jwt.verify(sessao.accessToken, env.JWT_SECRET) as jwt.JwtPayload;
    expect(cabecalho.alg).toBe('HS256');
    expect(declaracoes).toMatchObject({ sub: 7, sv: 3 });
    expect(Object.keys(declaracoes).sort()).toEqual(['exp', 'iat', 'sub', 'sv']);
    expect(declaracoes.exp! - declaracoes.iat!).toBe(env.ACCESS_TOKEN_TTL_SECONDS);
    expect(sessao.user).not.toHaveProperty('senha');
  });

  it('senha errada e e-mail inexistente dão o mesmo 401', async () => {
    bancoFalso(['senha FROM users WHERE email', () => credenciais()]);
    const senhaErrada = await erroDe(
      entrarComSenha({ email: 'ana@exemplo.invalid', password: 'senha-errada' }),
    );

    bancoFalso();
    const inexistente = await erroDe(
      entrarComSenha({ email: 'ninguem@exemplo.invalid', password: 'senha-certa' }),
    );

    expect(senhaErrada).toEqual({
      statusCode: 401,
      message: 'E-mail ou senha incorretos.',
      code: undefined,
    });
    expect(inexistente).toEqual(senhaErrada);
  });

  it('hash ilegível no banco conta como senha errada, não como 500', async () => {
    bancoFalso(['senha FROM users WHERE email', () => credenciais({ senha: '!sem-senha' })]);

    await expect(
      entrarComSenha({ email: 'ana@exemplo.invalid', password: 'senha-certa' }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it('conta bloqueada só revela o bloqueio para quem acerta a senha', async () => {
    bancoFalso(['senha FROM users WHERE email', () => credenciais({ bloqueado_em: new Date() })]);

    await expect(
      entrarComSenha({ email: 'ana@exemplo.invalid', password: 'senha-errada' }),
    ).rejects.toMatchObject({ statusCode: 401, code: undefined });
    await expect(
      entrarComSenha({ email: 'ana@exemplo.invalid', password: 'senha-certa' }),
    ).rejects.toMatchObject({ statusCode: 403, code: 'CONTA_BLOQUEADA' });
    expect(consultasCom('INSERT INTO refresh_tokens')).toHaveLength(0);
  });
});
