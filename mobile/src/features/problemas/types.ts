export type ProblemaTipo = 'problema' | 'ponto_positivo' | 'cultural';
export type ProblemaStatus =
  | 'ativo'
  | 'em_analise'
  | 'encaminhado'
  | 'resolvido'
  | 'removido';
export type ProblemaEscopo = 'local' | 'municipal' | 'estadual' | 'nacional';

export interface Problema {
  id: number;
  usuario_id: number;
  titulo: string;
  descricao: string | null;
  causa_id: number;
  tags: string[];
  tipo: ProblemaTipo;
  status: ProblemaStatus;
  local_nome: string | null;
  escopo: ProblemaEscopo;
  cont_apoios: number;
  cont_apoios_ponderados: number;
  cont_visualizacoes: number;
  criado_em: string;
  atualizado_em: string;
  lat: number;
  lng: number;
  distancia_m?: number;
}

export interface ProblemaQuery {
  lat?: number;
  lng?: number;
  raio?: number;
  causaId?: number;
  tags?: string[];
  tipo?: ProblemaTipo;
  status?: ProblemaStatus;
  escopo?: ProblemaEscopo;
  pagina?: number;
  limite?: number;
}

export interface ProblemaEstatisticas {
  total: number;
  porCausa: { causa_id: number; total: number }[];
  porTipo: { tipo: string; total: number }[];
}
