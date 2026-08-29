export interface CriarEventoInput {
  usuarioId: number;
  titulo: string;
  descricao?: string;
  causaId: number;
  tipo?: string;
  lat?: number;
  lng?: number;
  dataInicio: string;
  dataFim?: string;
}

export interface Evento {
  id: number;
  usuario_id: number;
  causa_id: number;
  titulo: string;
  descricao: string | null;
  tipo: string;
  lat: number | null;
  lng: number | null;
  data_inicio: string;
  data_fim: string | null;
  status: string;
  criado_em: string;
  cont_participantes?: number;
  problemas_vinculados?: number;
}

export interface ListarEventosQuery {
  lat?: number;
  lng?: number;
  raio?: number;
  causaId?: number;
  status?: string;
  tipo?: string;
  limite?: number;
  pagina?: number;
}

export interface VincularProblemaInput {
  eventoId: number;
  problemaId: number;
  usuarioId: number;
  resolveu?: boolean;
}
