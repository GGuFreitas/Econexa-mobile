import { AppError } from '@shared/errors.js';
import type { Executor } from '@shared/transacao.js';
import * as sql from './problemaEventos.sql.js';
import type {
  ListarEventosQuery,
  ProblemaEvento,
  ProblemaEventoRow,
  RegistrarEventoInput,
} from './problemaEventos.types.js';

function apresentar(row: ProblemaEventoRow): ProblemaEvento {
  return {
    id: row.id,
    problema_id: row.problema_id,
    tipo: row.tipo,
    dados: row.dados ?? {},
    criado_em: row.criado_em,
    autor: row.usuario_id != null ? { id: row.usuario_id, nome: row.autor_nome ?? '' } : null,
  };
}

export async function registrarEvento(
  input: RegistrarEventoInput,
  executor?: Executor,
): Promise<ProblemaEvento> {
  const row = await sql.inserirEvento(input, executor);
  return apresentar(row);
}

export async function listarEventosProblema(
  query: ListarEventosQuery,
): Promise<ProblemaEvento[]> {
  const existe = await sql.problemaExiste(query.problemaId);
  if (!existe) {
    throw new AppError('Problema não encontrado.', 404);
  }

  const rows = await sql.listarEventos(query);
  return rows.map(apresentar);
}
