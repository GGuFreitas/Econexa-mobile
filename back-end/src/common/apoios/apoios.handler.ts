import { AppError } from '@shared/errors.js';
import { emTransacao } from '@shared/transacao.js';
import { invalidarCacheDeProblemas } from '@common/problemas/problemas.handler.js';
import { registrarEvento } from '@common/problemaEventos/problemaEventos.handler.js';
import * as sql from './apoios.sql.js';
import type { ApoioResultado } from './apoios.types.js';

export async function apoiarProblema(
  problemaId: number,
  usuarioId: number,
): Promise<ApoioResultado> {
  const existe = await sql.problemaExiste(problemaId);
  if (!existe) {
    throw new AppError('Problema não encontrado.', 404);
  }

  const contadores = await emTransacao(async (executor) => {
    const aplicado = await sql.aplicarApoio(problemaId, usuarioId, executor);
    if (!aplicado) {
      return sql.obterContadores(problemaId, executor);
    }

    await registrarEvento({ problemaId, tipo: 'APOIO_CRIADO', usuarioId }, executor);
    return aplicado;
  });

  await invalidarCacheDeProblemas();
  return { apoiado: true, ...contadores };
}

export async function desapoiarProblema(
  problemaId: number,
  usuarioId: number,
): Promise<ApoioResultado> {
  const existe = await sql.problemaExiste(problemaId);
  if (!existe) {
    throw new AppError('Problema não encontrado.', 404);
  }

  const contadores = await emTransacao(async (executor) => {
    const retirado = await sql.retirarApoio(problemaId, usuarioId, executor);
    if (!retirado) {
      return sql.obterContadores(problemaId, executor);
    }

    await registrarEvento({ problemaId, tipo: 'APOIO_REMOVIDO', usuarioId }, executor);
    return retirado;
  });

  await invalidarCacheDeProblemas();
  return { apoiado: false, ...contadores };
}
