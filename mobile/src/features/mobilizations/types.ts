export type MobilizacaoStatus = 'agendada' | 'em_andamento' | 'realizada' | 'cancelada';

export interface Mobilizacao {
  id: number;
  problema_id: number;
  usuario_id: number;
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string | null;
  local_nome: string | null;
  lat: number | null;
  lng: number | null;
  status: MobilizacaoStatus;
  resultado_descricao: string | null;
  resultado_metricas: Record<string, number> | null;
  criado_em: string;
  atualizado_em: string;
  cont_participantes: number;
  usuario_participa: boolean;
  pode_gerenciar: boolean;
}

export interface MobilizacaoQuery {
  problemaId: number;
  pagina?: number;
  limite?: number;
}

export interface CriarMobilizacaoInput {
  problemaId: number;
  titulo: string;
  descricao?: string;
  dataInicio: string;
  dataFim?: string;
  localNome?: string;
  lat?: number;
  lng?: number;
}

export interface AtualizarMobilizacaoInput {
  titulo?: string;
  descricao?: string;
  dataInicio?: string;
  dataFim?: string;
  localNome?: string;
  lat?: number;
  lng?: number;
}

export interface ResultadoMobilizacaoInput {
  descricao: string;
  metricas?: Record<string, number>;
  imagens?: string[];
}

