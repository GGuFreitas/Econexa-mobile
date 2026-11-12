import { AppError } from '@shared/errors.js';
import { contaBloqueada } from '@shared/auth.js';
import { enviarEmail, type MensagemEmail } from '@shared/email.js';
import { emTransacao, type Executor } from '@shared/transacao.js';
import { dbPool } from '@config/database.js';
import { env } from '@config/env.js';
import * as sql from './auth.sql.js';
import {
  emailDeCodigo,
  emailDeVerificacao,
  VALIDADE_DA_VERIFICACAO_HORAS,
  VALIDADE_DO_CODIGO_MINUTOS,
} from './auth.emails.js';
import { codigoDeSeisDigitos, hashDeSegredo, hashesIguais, tokenAleatorio } from './segredos.js';
import { conferirSenha, conferirSenhaFicticia, gerarHashDeSenha } from './senha.js';
import { emitirSessao, paraUsuarioPublico, revogarTodasAsSessoes } from './sessao.js';
import type {
  CadastroInput,
  LoginInput,
  PublicUser,
  RedefinicaoDeSenhaInput,
  ResultadoDaConfirmacao,
  Sessao,
  UsuarioRow,
} from './auth.types.js';

export const TENTATIVAS_POR_CODIGO = 5;
const BYTES_DO_TOKEN_DE_VERIFICACAO = 32;

function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

function violacaoDeUnicidade(erro: unknown): boolean {
  return (erro as { code?: string }).code === '23505';
}

function emailJaCadastrado(): AppError {
  return new AppError('Já existe um usuário cadastrado com este e-mail.', 409);
}

function credenciaisInvalidas(): AppError {
  return new AppError('E-mail ou senha incorretos.', 401);
}

function codigoInvalido(): AppError {
  return new AppError('Código inválido ou expirado. Peça um novo código.', 400, 'CODIGO_INVALIDO');
}

async function enviarSemDerrubar(mensagem: MensagemEmail, descricao: string): Promise<void> {
  try {
    await enviarEmail(mensagem);
  } catch (erro) {
    const motivo = erro instanceof Error ? erro.message : String(erro);
    console.error(`Falha ao enviar ${descricao}: ${motivo}`);
  }
}

async function criarTokenDeVerificacao(usuarioId: number, executor: Executor = dbPool): Promise<string> {
  const token = tokenAleatorio(BYTES_DO_TOKEN_DE_VERIFICACAO);
  await sql.inserirTokenDeVerificacao(
    usuarioId,
    hashDeSegredo(token),
    VALIDADE_DA_VERIFICACAO_HORAS,
    executor,
  );
  return token;
}

async function enviarVerificacao(usuario: UsuarioRow, token: string): Promise<void> {
  const link = `${env.API_PUBLIC_URL}/api/auth/verify-email?token=${token}`;
  await enviarSemDerrubar(
    emailDeVerificacao(usuario.email, link),
    `o e-mail de verificação do usuário ${usuario.id}`,
  );
}

export async function cadastrarUsuario(input: CadastroInput): Promise<Sessao> {
  const nome = input.nome.trim();
  const email = normalizarEmail(input.email);

  if (await sql.buscarUsuarioPorEmail(email)) {
    throw emailJaCadastrado();
  }

  const senhaHash = await gerarHashDeSenha(input.password);
  const { usuario, token, sessao } = await emTransacao(async (executor) => {
    let criado: UsuarioRow;
    try {
      criado = await sql.inserirUsuario({ nome, email, senhaHash, emailVerificado: false }, executor);
    } catch (erro) {
      if (violacaoDeUnicidade(erro)) throw emailJaCadastrado();
      throw erro;
    }

    return {
      usuario: criado,
      token: await criarTokenDeVerificacao(criado.id, executor),
      sessao: await emitirSessao(criado, executor),
    };
  });

  await enviarVerificacao(usuario, token);
  return sessao;
}

export async function entrarComSenha(input: LoginInput): Promise<Sessao> {
  const usuario = await sql.buscarCredenciaisPorEmail(normalizarEmail(input.email));

  if (!usuario) {
    await conferirSenhaFicticia(input.password);
    throw credenciaisInvalidas();
  }

  if (!(await conferirSenha(usuario.senha, input.password))) {
    throw credenciaisInvalidas();
  }

  if (usuario.bloqueado_em) {
    throw contaBloqueada();
  }

  return emitirSessao(usuario);
}

export async function obterUsuarioAtual(usuarioId: number): Promise<{ user: PublicUser }> {
  const usuario = await sql.buscarUsuarioPorId(usuarioId);
  if (!usuario) {
    throw new AppError('Usuário não encontrado.', 404);
  }
  return { user: paraUsuarioPublico(usuario) };
}

export async function reenviarVerificacao(usuarioId: number): Promise<void> {
  const usuario = await sql.buscarUsuarioPorId(usuarioId);
  if (!usuario || usuario.email_verificado) return;

  const token = await criarTokenDeVerificacao(usuario.id);
  await enviarVerificacao(usuario, token);
}

export async function confirmarEmail(token: string): Promise<ResultadoDaConfirmacao> {
  const tokenHash = hashDeSegredo(token);

  const resultado = await emTransacao<ResultadoDaConfirmacao | null>(async (executor) => {
    const usuarioId = await sql.reivindicarTokenDeVerificacao(tokenHash, executor);
    if (usuarioId === null) return null;

    const marcou = await sql.marcarEmailVerificado(usuarioId, executor);
    return marcou ? 'confirmado' : 'ja_confirmado';
  });
  if (resultado) return resultado;

  return (await sql.emailDoTokenJaVerificado(tokenHash)) ? 'ja_confirmado' : 'invalido';
}

export async function solicitarRedefinicaoDeSenha(emailInformado: string): Promise<void> {
  const usuario = await sql.buscarUsuarioPorEmail(normalizarEmail(emailInformado));
  if (!usuario) return;

  const codigo = codigoDeSeisDigitos();
  await emTransacao(async (executor) => {
    await sql.invalidarCodigosDeRedefinicao(usuario.id, executor);
    await sql.inserirCodigoDeRedefinicao(
      usuario.id,
      hashDeSegredo(codigo),
      VALIDADE_DO_CODIGO_MINUTOS,
      executor,
    );
  });

  await enviarSemDerrubar(
    emailDeCodigo(usuario.email, codigo),
    `o código de redefinição de senha do usuário ${usuario.id}`,
  );
}

export async function redefinirSenha(input: RedefinicaoDeSenhaInput): Promise<Sessao> {
  const usuario = await sql.buscarUsuarioPorEmail(normalizarEmail(input.email));
  if (!usuario) {
    throw codigoInvalido();
  }

  const reservado = await sql.reservarTentativaDeCodigo(usuario.id, TENTATIVAS_POR_CODIGO);
  if (!reservado || !hashesIguais(hashDeSegredo(input.code), reservado.codigo_hash)) {
    throw codigoInvalido();
  }

  const senhaHash = await gerarHashDeSenha(input.password);
  return emTransacao(async (executor) => {
    if (!(await sql.consumirCodigoDeRedefinicao(reservado.id, executor))) {
      throw codigoInvalido();
    }

    const atualizado = await sql.gravarSenhaRedefinida(usuario.id, senhaHash, executor);
    if (!atualizado) {
      throw codigoInvalido();
    }
    if (atualizado.bloqueado_em) {
      throw contaBloqueada();
    }

    await revogarTodasAsSessoes(usuario.id, executor);
    return emitirSessao(atualizado, executor);
  });
}
