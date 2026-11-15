import { AppError } from '@shared/errors.js';
import { emTransacao, type Executor } from '@shared/transacao.js';
import { conferirSenha } from './senha.js';
import * as sql from './exclusao.sql.js';

function senhaIncorreta(): AppError {
  return new AppError('Senha incorreta.', 400, 'SENHA_INCORRETA');
}

async function anonimizar(usuarioId: number, executor: Executor): Promise<void> {
  await sql.anonimizarConta(usuarioId, executor);
  await sql.apagarDadosDeAcesso(usuarioId, executor);
}

export async function excluirConta(usuarioId: number, senha?: string): Promise<void> {
  await emTransacao(async (executor) => {
    const conta = await sql.travarConta(usuarioId, executor);
    if (!conta || conta.excluido_em) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    if (conta.senha) {
      if (!senha) throw new AppError('Informe a senha para excluir a conta.', 400, 'SENHA_INCORRETA');
      if (!(await conferirSenha(conta.senha, senha))) throw senhaIncorreta();
    }

    await anonimizar(usuarioId, executor);
  });
}

export async function excluirContaPorEmail(email: string): Promise<boolean> {
  const usuarioId = await sql.buscarIdPorEmail(email.trim().toLowerCase());
  if (usuarioId === null) return false;

  return emTransacao(async (executor) => {
    const conta = await sql.travarConta(usuarioId, executor);
    if (!conta || conta.excluido_em) return false;
    await anonimizar(usuarioId, executor);
    return true;
  });
}
