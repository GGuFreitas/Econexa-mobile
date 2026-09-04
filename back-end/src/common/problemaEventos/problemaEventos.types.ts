export type ProblemaEventoTipo =
  | 'PROBLEMA_CRIADO'
  | 'EVIDENCIA_ADICIONADA'
  | 'COMENTARIO_CRIADO'
  | 'APOIO_CRIADO'
  | 'APOIO_REMOVIDO'
  | 'MOBILIZACAO_CRIADA'
  | 'MOBILIZACAO_REALIZADA'
  | 'ENCAMINHADO'
  | 'RESPOSTA_RECEBIDA'
  | 'STATUS_ALTERADO'
  | 'RESOLVIDO';

export interface ProblemaEventoRow {
  id: number;
  problema_id: number;
  tipo: ProblemaEventoTipo;
  usuario_id: number | null;
  dados: Record<string, unknown> | null;
  criado_em: Date | string;
  autor_nome: string | null;
}

export interface ProblemaEventoAutor {
  id: number;
  nome: string;
}

export interface ProblemaEvento {
  id: number;
  problema_id: number;
  tipo: ProblemaEventoTipo;
  dados: Record<string, unknown>;
  criado_em: Date | string;
  autor: ProblemaEventoAutor | null;
}

export interface RegistrarEventoInput {
  problemaId: number;
  tipo: ProblemaEventoTipo;
  usuarioId?: number | null;
  dados?: Record<string, unknown>;
}

export interface ListarEventosQuery {
  problemaId: number;
  pagina?: number;
  limite?: number;
}
