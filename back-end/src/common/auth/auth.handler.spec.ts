import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { hash, verify } from '@node-rs/argon2';
import jwt from 'jsonwebtoken';
import { dbPool } from '@config/database.js';
import { env } from '@config/env.js';
import { enviarEmail } from '@shared/email.js';
import { verificarIdTokenGoogle } from '@shared/google.js';
import {
  cadastrarUsuario,
  confirmarEmail,
  entrarComGoogle,
  entrarComSenha,
  redefinirSenha,
  solicitarRedefinicaoDeSenha,
} from './auth.handler.js';
import { hashDeSegredo } from './segredos.js';

vi.mock('@config/database.js', () => ({
  dbPool: { query: vi.fn() },
}));

vi.mock('@shared/transacao.js', async () => {
  const { dbPool: pool } = await import('@config/database.js');
  return { emTransacao: (fn: (executor: unknown) => unknown) => fn(pool) };
});

vi.mock('@shared/email.js', () => ({
  enviarEmail: vi.fn(),
}));

vi.mock('@shared/google.js', () => ({
  verificarIdTokenGoogle: vi.fn(),
}));

vi.mock('@node-rs/argon2', async (importOriginal) => {
  const real = await importOriginal<typeof import('@node-rs/argon2')>();
  return { ...real, hash: vi.fn(real.hash), verify: vi.fn(real.verify) };
});

type Regra = [trecho: string, linhas: (params: unknown[]) => unknown[]];

const mockQuery = dbPool.query as unknown as ReturnType<typeof vi.fn>;
const mockEnviarEmail = vi.mocked(enviarEmail);
const mockVerificarGoogle = vi.mocked(verificarIdTokenGoogle);
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
    email_verificado: false,
    tem_senha: true,
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
  mockEnviarEmail.mockReset();
  mockEnviarEmail.mockResolvedValue({ from: 'Mutira', to: 'caixa-dev', subject: 's', text: 't' });
  mockVerificarGoogle.mockReset();
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
  it('cria citizen, devolve sessão e manda por e-mail o token cujo hash foi gravado', async () => {
    let paramsDoUsuario: unknown[] = [];
    let hashGravado = '';
    bancoFalso(
      ['INSERT INTO users', (params) => {
        paramsDoUsuario = params;
        return [linhaUsuario()];
      }],
      ['INSERT INTO email_verification_tokens', (params) => {
        hashGravado = String(params[1]);
        return [];
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
    expect(sessao.user).toMatchObject({ email_verified: false, has_password: true, role: 'citizen' });

    const mensagem = mockEnviarEmail.mock.calls[0][0];
    const token = /verify-email\?token=([\w-]+)/.exec(mensagem.corpo)![1];
    expect(mensagem.assunto).toBe('Confirme seu e-mail no Mutira');
    expect(hashDeSegredo(token)).toBe(hashGravado);
    expect(hashGravado).not.toBe(token);
  });

  it('e-mail já cadastrado responde 409 sem gravar nada', async () => {
    bancoFalso(['FROM users WHERE email', () => [linhaUsuario()]]);

    await expect(
      cadastrarUsuario({ nome: 'Ana', email: 'ana@exemplo.invalid', password: 'senha-forte' }),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect(consultasCom('INSERT')).toHaveLength(0);
    expect(mockEnviarEmail).not.toHaveBeenCalled();
  });

  it('a corrida entre dois cadastros vira 409, não 500', async () => {
    bancoFalso(['INSERT INTO users', () => {
      throw Object.assign(new Error('duplicate key'), { code: '23505' });
    }]);

    await expect(
      cadastrarUsuario({ nome: 'Ana', email: 'ana@exemplo.invalid', password: 'senha-forte' }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('falha de SMTP não derruba o cadastro e o log não leva o token', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockEnviarEmail.mockRejectedValueOnce(new Error('smtp fora do ar'));
    let hashGravado = '';
    bancoFalso(
      ['INSERT INTO users', () => [linhaUsuario()]],
      ['INSERT INTO email_verification_tokens', (params) => {
        hashGravado = String(params[1]);
        return [];
      }],
      ['INSERT INTO refresh_tokens', () => [{ id: 1, sessao_versao: 0 }]],
    );

    const sessao = await cadastrarUsuario({
      nome: 'Ana',
      email: 'ana@exemplo.invalid',
      password: 'senha-forte',
    });

    expect(sessao.refreshToken).toBeTruthy();
    expect(log).toHaveBeenCalledTimes(1);
    const registrado = String(log.mock.calls[0][0]);
    expect(registrado).toContain('smtp fora do ar');
    expect(registrado).not.toContain('token=');
    expect(registrado).not.toContain(hashGravado);
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

  it('senha errada, e-mail inexistente e conta só-Google dão o mesmo 401', async () => {
    bancoFalso(['senha FROM users WHERE email', () => credenciais()]);
    const senhaErrada = await erroDe(
      entrarComSenha({ email: 'ana@exemplo.invalid', password: 'senha-errada' }),
    );

    bancoFalso();
    const inexistente = await erroDe(
      entrarComSenha({ email: 'ninguem@exemplo.invalid', password: 'senha-certa' }),
    );

    bancoFalso(['senha FROM users WHERE email', () => credenciais({ senha: null, tem_senha: false })]);
    const soGoogle = await erroDe(
      entrarComSenha({ email: 'ana@exemplo.invalid', password: 'senha-certa' }),
    );

    expect(senhaErrada).toEqual({
      statusCode: 401,
      message: 'E-mail ou senha incorretos.',
      code: undefined,
    });
    expect(inexistente).toEqual(senhaErrada);
    expect(soGoogle).toEqual(senhaErrada);
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

describe('confirmação de e-mail', () => {
  it('link válido de conta não verificada confirma', async () => {
    bancoFalso(
      ['UPDATE email_verification_tokens', () => [{ usuario_id: 7 }]],
      ['UPDATE users SET email_verificado', () => [{ id: 7 }]],
    );

    expect(await confirmarEmail('token')).toBe('confirmado');
    expect(consultasCom('UPDATE email_verification_tokens')[0][1]).toEqual([hashDeSegredo('token')]);
  });

  it('link válido de conta que já se verificou por outro caminho é "já confirmado"', async () => {
    bancoFalso(['UPDATE email_verification_tokens', () => [{ usuario_id: 7 }]]);

    expect(await confirmarEmail('token')).toBe('ja_confirmado');
  });

  it('link já usado é "já confirmado"; desconhecido ou expirado é inválido', async () => {
    bancoFalso(['FROM email_verification_tokens t', () => [{ email_verificado: true }]]);
    expect(await confirmarEmail('usado')).toBe('ja_confirmado');

    bancoFalso(['FROM email_verification_tokens t', () => [{ email_verificado: false }]]);
    expect(await confirmarEmail('expirado')).toBe('invalido');

    bancoFalso();
    expect(await confirmarEmail('desconhecido')).toBe('invalido');
  });
});

describe('esqueci minha senha', () => {
  it('e-mail sem conta não grava código nem manda e-mail', async () => {
    bancoFalso();

    await solicitarRedefinicaoDeSenha('ninguem@exemplo.invalid');

    expect(consultasCom('password_reset_tokens')).toHaveLength(0);
    expect(mockEnviarEmail).not.toHaveBeenCalled();
  });

  it('invalida os códigos anteriores antes de gravar o hash do código enviado', async () => {
    let hashGravado = '';
    bancoFalso(
      ['FROM users WHERE email', () => [linhaUsuario()]],
      ['INSERT INTO password_reset_tokens', (params) => {
        hashGravado = String(params[1]);
        return [];
      }],
    );

    await solicitarRedefinicaoDeSenha('Ana@Exemplo.Invalid');

    const escritas = mockQuery.mock.calls
      .map(([sql]) => String(sql))
      .filter((sql) => sql.includes('password_reset_tokens'));
    expect(escritas[0]).toContain('UPDATE password_reset_tokens SET usado_em');
    expect(escritas[1]).toContain('INSERT INTO password_reset_tokens');

    const mensagem = mockEnviarEmail.mock.calls[0][0];
    const codigo = /^\d{6}$/m.exec(mensagem.corpo)![0];
    expect(mensagem.assunto).toBe('Seu código para redefinir a senha do Mutira');
    expect(hashDeSegredo(codigo)).toBe(hashGravado);
  });

  it('e-mail inexistente e código errado dão o mesmo CODIGO_INVALIDO', async () => {
    bancoFalso();
    const semConta = await erroDe(
      redefinirSenha({ email: 'ninguem@exemplo.invalid', code: '123456', password: 'senha-nova-1' }),
    );

    bancoFalso(
      ['FROM users WHERE email', () => [linhaUsuario()]],
      ['SET tentativas = tentativas + 1', () => [{ id: 3, codigo_hash: hashDeSegredo('654321') }]],
    );
    const codigoErrado = await erroDe(
      redefinirSenha({ email: 'ana@exemplo.invalid', code: '123456', password: 'senha-nova-1' }),
    );

    expect(semConta).toEqual({
      statusCode: 400,
      message: 'Código inválido ou expirado. Peça um novo código.',
      code: 'CODIGO_INVALIDO',
    });
    expect(codigoErrado).toEqual(semConta);
    expect(consultasCom('SET usado_em = NOW() WHERE id')).toHaveLength(0);
  });
});

describe('Google: regras de decisão', () => {
  it('sem GOOGLE_CLIENT_IDS responde 503 sem nem olhar o token', async () => {
    const configurados = env.GOOGLE_CLIENT_IDS;
    env.GOOGLE_CLIENT_IDS = [];
    try {
      await expect(entrarComGoogle('id-token')).rejects.toMatchObject({
        statusCode: 503,
        code: 'GOOGLE_INDISPONIVEL',
        message: 'Login com Google não está configurado.',
      });
      expect(mockVerificarGoogle).not.toHaveBeenCalled();
    } finally {
      env.GOOGLE_CLIENT_IDS = configurados;
    }
  });

  it('sem e-mail confirmado pelo Google, conta existente responde 409 antes de revelar bloqueio', async () => {
    mockVerificarGoogle.mockResolvedValue({
      sub: 'g-1',
      email: 'ana@exemplo.invalid',
      emailVerificado: false,
    });
    bancoFalso(['FROM users WHERE email', () => [linhaUsuario({ bloqueado_em: new Date() })]]);

    await expect(entrarComGoogle('id-token')).rejects.toMatchObject({ statusCode: 409 });
    expect(consultasCom('INSERT INTO usuario_oauth_contas')).toHaveLength(0);
  });

  it('dois toques simultâneos: o perdedor da corrida pelo UNIQUE refaz e entra pela conta vinculada', async () => {
    mockVerificarGoogle.mockResolvedValue({
      sub: 'g-1',
      email: 'nova@exemplo.invalid',
      emailVerificado: true,
    });
    let tentativas = 0;
    bancoFalso(
      ['FROM usuario_oauth_contas', () => (tentativas > 0 ? [linhaUsuario({ tem_senha: false })] : [])],
      ['INSERT INTO users', () => {
        tentativas += 1;
        throw Object.assign(new Error('duplicate key'), { code: '23505' });
      }],
      ['INSERT INTO refresh_tokens', () => [{ id: 1, sessao_versao: 0 }]],
    );

    const sessao = await entrarComGoogle('id-token');

    expect(sessao.user.id).toBe(7);
    expect(consultasCom('INSERT INTO users')).toHaveLength(1);
  });
});
