export type ProblemaTipo = 'problema' | 'ponto_positivo' | 'cultural';
export type ProblemaStatus = 'ativo' | 'em_analise' | 'encaminhado' | 'resolvido' | 'removido';
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
  criado_em: Date;
  atualizado_em: Date;
  lat: number;
  lng: number;
  distancia_m?: number;
}

export interface CriarProblemaInput {
  usuarioId: number;
  titulo: string;
  descricao?: string;
  causaId: number;
  tags?: string[];
  tipo?: ProblemaTipo;
  lat: number;
  lng: number;
  localNome?: string;
  escopo?: ProblemaEscopo;
}

export interface ProblemaDetalhe extends Problema {
  pode_encaminhar: boolean;
  pode_adicionar_evidencia: boolean;
  transicoes_permitidas: ProblemaStatus[];
}

export interface ResultadoCriacaoProblema {
  criado: boolean;
  problema: Problema;
}

export interface AlterarStatusProblemaInput {
  problemaId: number;
  status: ProblemaStatus;
  usuarioId: number;
  role: string;
}

export interface ListarProblemasQuery {
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
