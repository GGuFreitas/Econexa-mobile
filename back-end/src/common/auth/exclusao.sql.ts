import { dbPool } from '@config/database.js';
import type { Executor } from '@shared/transacao.js';

export const NOME_DA_CONTA_EXCLUIDA = 'Conta excluída';

export interface ContaParaExcluir {
  id: number;
  senha: string | null;
  excluido_em: Date | null;
}

export async function travarConta(
  usuarioId: number,
  executor: Executor = dbPool,
): Promise<ContaParaExcluir | null> {
  const result = await executor.query(
    'SELECT id, senha, excluido_em FROM users WHERE id = $1 FOR UPDATE',
    [usuarioId],
  );
  return result.rows[0] ?? null;
}

export async function anonimizarConta(usuarioId: number, executor: Executor): Promise<void> {
  await executor.query(
    `UPDATE users
     SET nome = $2,
         email = 'conta-excluida-' || id || '@excluida.mutira.invalid',
         senha = NULL,
         email_verificado = false,
         email_verificado_em = NULL,
         excluido_em = NOW(),
         sessao_versao = sessao_versao + 1
     WHERE id = $1`,
    [usuarioId, NOME_DA_CONTA_EXCLUIDA],
  );
}

export async function apagarDadosDeAcesso(usuarioId: number, executor: Executor): Promise<void> {
  for (const tabela of [
    'refresh_tokens',
    'password_reset_tokens',
    'email_verification_tokens',
    'usuario_oauth_contas',
  ]) {
    await executor.query(`DELETE FROM ${tabela} WHERE usuario_id = $1`, [usuarioId]);
  }
}
