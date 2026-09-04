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

export interface ProblemaDetalhe extends Problema {
  pode_encaminhar: boolean;
  pode_adicionar_evidencia: boolean;
  transicoes_permitidas: ProblemaStatus[];
}

export interface ResultadoCriacaoProblema {
  criado: boolean;
  problema: Problema;
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

export interface CriarProblemaPayload {
  titulo: string;
  descricao?: string;
  causaId: number;
  tags?: string[];
  tipo: ProblemaTipo;
  lat: number;
  lng: number;
  localNome?: string;
  escopo: ProblemaEscopo;
}

export interface ApoioResultado {
  apoiado: boolean;
  cont_apoios: number;
  cont_apoios_ponderados: number;
}

export type DenunciaMotivo = 'spam' | 'conteudo_inadequado' | 'duplicado' | 'outro';

export interface UploadFileInput {
  uri: string;
  name: string;
  type: string;
}

export interface ImagemProblema {
  id: number;
  tipo_entidade: string;
  entidade_id: number;
  url: string;
  principal: boolean;
  ordem: number;
  criado_em: string;
}

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

export interface ProblemaEventoAutor {
  id: number;
  nome: string;
}

export interface ProblemaEvento {
  id: number;
  problema_id: number;
  tipo: ProblemaEventoTipo;
  dados: Record<string, unknown>;
  criado_em: string;
  autor: ProblemaEventoAutor | null;
}

export interface EventoApresentado {
  id: number;
  tipo: ProblemaEventoTipo;
  data: string;
  titulo: string;
  descricao?: string;
  autor?: string;
}
