import { AppError } from '@shared/errors.js';
import { emTransacao } from '@shared/transacao.js';
import { can, ehAdmin, type Role } from '@common/abilities.js';
import { revogarTodasAsSessoes } from '@common/auth/sessao.js';
import * as sql from './moderacao.sql.js';
import type { FilaDeDenunciasQuery, ProblemaDenunciado } from './moderacao.types.js';

export interface Moderador {
  id: number;
  role: string;
}

function exigirModeracao(moderador: Moderador): void {
  if (!can(moderador.role as Role, 'problemas:moderate')) {
    throw new AppError('Apenas a moderação pode fazer isso.', 403);
  }
}

export async function filaDeDenuncias(
  moderador: Moderador,
  query: FilaDeDenunciasQuery,
): Promise<ProblemaDenunciado[]> {
  exigirModeracao(moderador);
  return sql.listarProblemasDenunciados(query);
}

export async function descartarDenuncias(moderador: Moderador, problemaId: number): Promise<void> {
  exigirModeracao(moderador);
  if ((await sql.descartarDenuncias(problemaId)) === 0) {
    throw new AppError('Este problema não tem denúncias.', 404);
  }
}

export async function bloquearConta(
  moderador: Moderador,
  usuarioId: number,
  motivo: string,
): Promise<void> {
  exigirModeracao(moderador);
  if (usuarioId === moderador.id) {
    throw new AppError('Você não pode bloquear a própria conta.', 400);
  }

  await emTransacao(async (executor) => {
    const alvo = await sql.travarAlvo(usuarioId, executor);
    if (!alvo || alvo.excluido_em) {
      throw new AppError('Usuário não encontrado.', 404);
    }
    if (ehAdmin(alvo.role)) {
      throw new AppError('Contas da moderação não podem ser bloqueadas por aqui.', 400);
    }
    if (alvo.bloqueado_em) return;

    await sql.gravarBloqueio(usuarioId, moderador.id, motivo, executor);
    await revogarTodasAsSessoes(usuarioId, executor);
  });
}

export async function desbloquearConta(moderador: Moderador, usuarioId: number): Promise<void> {
  exigirModeracao(moderador);
  if (!(await sql.removerBloqueio(usuarioId))) {
    throw new AppError('Esta conta não está bloqueada.', 404);
  }
}
