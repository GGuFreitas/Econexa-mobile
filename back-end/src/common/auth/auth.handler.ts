import { AppError } from '@shared/errors.js';
import { contaBloqueada } from '@shared/auth.js';
import { emTransacao } from '@shared/transacao.js';
import * as sql from './auth.sql.js';
import { conferirSenha, conferirSenhaFicticia, gerarHashDeSenha } from './senha.js';
import { emitirSessao, paraUsuarioPublico } from './sessao.js';
import type { CadastroInput, LoginInput, PublicUser, Sessao, UsuarioRow } from './auth.types.js';

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

export async function cadastrarUsuario(input: CadastroInput): Promise<Sessao> {
  const nome = input.nome.trim();
  const email = normalizarEmail(input.email);

  if (await sql.buscarUsuarioPorEmail(email)) {
    throw emailJaCadastrado();
  }

  const senhaHash = await gerarHashDeSenha(input.password);
  return emTransacao(async (executor) => {
    let criado: UsuarioRow;
    try {
      criado = await sql.inserirUsuario({ nome, email, senhaHash }, executor);
    } catch (erro) {
      if (violacaoDeUnicidade(erro)) throw emailJaCadastrado();
      throw erro;
    }

    return emitirSessao(criado, executor);
  });
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
