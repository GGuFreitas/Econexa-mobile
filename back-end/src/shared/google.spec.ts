import { beforeAll, describe, expect, it } from 'vitest';
import {
  createLocalJWKSet,
  errors,
  exportJWK,
  generateKeyPair,
  SignJWT,
  type CryptoKey,
  type JWTVerifyGetKey,
} from 'jose';
import { verificarIdTokenGoogle } from './google.js';

const CLIENTE = 'cliente-web-teste.apps.googleusercontent.com';

let chaves: JWTVerifyGetKey;
let chavePrivada: CryptoKey;
let chaveDeOutroEmissor: CryptoKey;

interface OpcoesDoToken {
  issuer?: string;
  audience?: string;
  sub?: string;
  expiraEm?: number | string;
  chave?: CryptoKey;
}

function tokenDoGoogle(declaracoes: Record<string, unknown> = {}, opcoes: OpcoesDoToken = {}) {
  return new SignJWT({ email: 'Ana@Gmail.com', email_verified: true, name: '  Ana Souza ', ...declaracoes })
    .setProtectedHeader({ alg: 'RS256', kid: 'chave-de-teste' })
    .setIssuer(opcoes.issuer ?? 'https://accounts.google.com')
    .setAudience(opcoes.audience ?? CLIENTE)
    .setSubject(opcoes.sub ?? '109876543210987654321')
    .setIssuedAt()
    .setExpirationTime(opcoes.expiraEm ?? '1h')
    .sign(opcoes.chave ?? chavePrivada);
}

beforeAll(async () => {
  const par = await generateKeyPair('RS256');
  chavePrivada = par.privateKey;
  chaveDeOutroEmissor = (await generateKeyPair('RS256')).privateKey;

  const publica = await exportJWK(par.publicKey);
  chaves = createLocalJWKSet({ keys: [{ ...publica, kid: 'chave-de-teste', alg: 'RS256' }] });
});

describe('verificarIdTokenGoogle', () => {
  it('devolve o perfil com e-mail em minúsculas e nome aparado', async () => {
    const perfil = await verificarIdTokenGoogle(await tokenDoGoogle(), chaves);

    expect(perfil).toEqual({
      sub: '109876543210987654321',
      email: 'ana@gmail.com',
      emailVerificado: true,
      nome: 'Ana Souza',
    });
  });

  it('aceita o emissor sem https, que o Google também usa', async () => {
    const perfil = await verificarIdTokenGoogle(
      await tokenDoGoogle({}, { issuer: 'accounts.google.com' }),
      chaves,
    );

    expect(perfil.sub).toBe('109876543210987654321');
  });

  it('lê email_verified como texto e trata a ausência como não verificado', async () => {
    const comoTexto = await verificarIdTokenGoogle(
      await tokenDoGoogle({ email_verified: 'true' }),
      chaves,
    );
    const ausente = await verificarIdTokenGoogle(
      await tokenDoGoogle({ email_verified: undefined, name: undefined }),
      chaves,
    );

    expect(comoTexto.emailVerificado).toBe(true);
    expect(ausente.emailVerificado).toBe(false);
    expect(ausente.nome).toBeUndefined();
  });

  it.each([
    ['de outro cliente (audience)', () => tokenDoGoogle({}, { audience: 'outro-app.apps.googleusercontent.com' })],
    ['de outro emissor', () => tokenDoGoogle({}, { issuer: 'https://accounts.evil.example' })],
    ['expirado', () => tokenDoGoogle({}, { expiraEm: Math.floor(Date.now() / 1000) - 60 })],
    ['assinado por outra chave', () => tokenDoGoogle({}, { chave: chaveDeOutroEmissor })],
    ['sem e-mail', () => tokenDoGoogle({ email: undefined })],
    ['simétrico (HS256)', () =>
      new SignJWT({ email: 'ana@gmail.com' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuer('https://accounts.google.com')
        .setAudience(CLIENTE)
        .setSubject('1')
        .setExpirationTime('1h')
        .sign(new TextEncoder().encode('segredo-que-qualquer-um-escolhe'))],
    ['que nem é JWT', async () => 'isto-nao-e-um-token'],
  ])('recusa com 401 o token %s', async (_caso, gerar) => {
    await expect(verificarIdTokenGoogle(await gerar(), chaves)).rejects.toMatchObject({
      statusCode: 401,
      code: undefined,
    });
  });

  it('falha de rede ou timeout ao buscar as chaves é 503 GOOGLE_INDISPONIVEL, não culpa do token', async () => {
    const semRede: JWTVerifyGetKey = async () => {
      throw new TypeError('fetch failed');
    };
    const lento: JWTVerifyGetKey = async () => {
      throw new errors.JWKSTimeout();
    };
    const token = await tokenDoGoogle();

    await expect(verificarIdTokenGoogle(token, semRede)).rejects.toMatchObject({
      statusCode: 503,
      code: 'GOOGLE_INDISPONIVEL',
    });
    await expect(verificarIdTokenGoogle(token, lento)).rejects.toMatchObject({
      statusCode: 503,
      code: 'GOOGLE_INDISPONIVEL',
    });
  });
});
