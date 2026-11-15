import { dbPool } from '@config/database.js';
import { env } from '@config/env.js';
import { AppError } from '@shared/errors.js';
import { assinarAccessToken, contaBloqueada } from '@shared/auth.js';
import { emTransacao, type Executor } from '@shared/transacao.js';
import { hashDeSegredo, tokenAleatorio } from './segredos.js';
import * as sql from './sessao.sql.js';
import type { PublicUser, Sessao, UsuarioRow } from './auth.types.js';

const BYTES_DO_REFRESH_TOKEN = 48;

export function paraUsuarioPublico(usuario: UsuarioRow): PublicUser {
  return {
    id: usuario.id,
    name: usuario.nome,
    email: usuario.email,
    role: usuario.role as PublicUser['role'],
    vote_weight: usuario.peso_voto,
    email_verified: usuario.email_verificado,
    has_password: usuario.tem_senha,
  };
}

function sessaoInvalida(): AppError {
  return new AppError('Sua sessão expirou. Entre de novo.', 401, 'SESSAO_INVALIDA');
}

function sessaoComprometida(): AppError {
  return new AppError(
    'Sua sessão foi encerrada por segurança. Entre de novo.',
    401,
    'SESSAO_COMPROMETIDA',
  );
}

async function gravarRefreshToken(usuarioId: number, executor: Executor) {
  const refreshToken = tokenAleatorio(BYTES_DO_REFRESH_TOKEN);
  const emitido = await sql.inserirRefreshToken(
    usuarioId,
    hashDeSegredo(refreshToken),
    env.REFRESH_TOKEN_TTL_DAYS,
    executor,
  );
  if (!emitido) throw sessaoInvalida();
  return { refreshToken, emitido };
}

function montarSessao(usuario: UsuarioRow, sessaoVersao: number, refreshToken: string): Sessao {
  return {
    accessToken: assinarAccessToken(usuario.id, sessaoVersao),
    refreshToken,
    expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
    tokenType: 'Bearer',
    user: paraUsuarioPublico(usuario),
  };
}

export async function emitirSessao(usuario: UsuarioRow, executor: Executor = dbPool): Promise<Sessao> {
  const { refreshToken, emitido } = await gravarRefreshToken(usuario.id, executor);
  return montarSessao(usuario, emitido.sessao_versao, refreshToken);
}

export async function renovarSessao(refreshToken: string): Promise<Sessao> {
  const tokenHash = hashDeSegredo(refreshToken);

  const sessao = await emTransacao(async (executor) => {
    const usuario = await sql.travarUsuarioDoRefreshToken(tokenHash, executor);
    if (!usuario) return null;
    if (usuario.bloqueado_em) throw contaBloqueada();

    const reivindicado = await sql.reivindicarRefreshToken(tokenHash, executor);
    if (!reivindicado) return null;

    const novo = await gravarRefreshToken(usuario.id, executor);
    await sql.registrarSubstituto(reivindicado.id, novo.emitido.id, executor);
    return montarSessao(usuario, novo.emitido.sessao_versao, novo.refreshToken);
  });
  if (sessao) return sessao;

  const cadeia = await sql.situacaoDaCadeia(tokenHash);
  if (cadeia?.viva) {
    await revogarTodasAsSessoes(cadeia.usuario_id);
    throw sessaoComprometida();
  }
  throw sessaoInvalida();
}

export async function revogarRefreshToken(refreshToken: string): Promise<void> {
  await sql.revogarRefreshToken(hashDeSegredo(refreshToken));
}

async function revogarNaTransacao(usuarioId: number, transacao: Executor): Promise<number | null> {
  const sessaoVersao = await sql.incrementarSessaoVersao(usuarioId, transacao);
  await sql.revogarRefreshTokensDoUsuario(usuarioId, transacao);
  return sessaoVersao;
}

export async function revogarTodasAsSessoes(
  usuarioId: number,
  executor?: Executor,
): Promise<number | null> {
  if (!executor || executor === dbPool) {
    return emTransacao((transacao) => revogarNaTransacao(usuarioId, transacao));
  }
  return revogarNaTransacao(usuarioId, executor);
}
