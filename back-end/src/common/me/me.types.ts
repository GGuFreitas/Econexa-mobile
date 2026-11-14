import type { MobilizacaoStatus } from '@common/mobilizacoes/mobilizacoes.types.js';

export type PapelNaAcao = 'organizadora' | 'participante';

export interface AvisoPertoDaMeta {
  tipo: 'perto_da_meta';
  problema_id: number;
  titulo: string;
  cont_apoios: number;
  meta: number;
}

export interface AvisoSemResposta {
  tipo: 'sem_resposta';
  problema_id: number;
  encaminhamento_id: number;
  titulo: string;
  orgao: string;
  enviado_em: Date;
  dias: number;
}

export interface AvisoAcaoProxima {
  tipo: 'acao_proxima';
  mobilizacao_id: number;
  problema_id: number;
  titulo: string;
  data_inicio: Date;
  cont_participantes: number;
  papel: PapelNaAcao;
}

export type Aviso = AvisoPertoDaMeta | AvisoSemResposta | AvisoAcaoProxima;

export interface ContagensDoUsuario {
  membro_desde: Date;
  relatados: number;
  apoios_dados: number;
  apoios_recebidos: number;
  acoes: number;
}

export interface ResumoDoUsuario extends ContagensDoUsuario {
  avisos: Aviso[];
}

export interface AcaoDoUsuario {
  id: number;
  problema_id: number;
  problema_titulo: string;
  titulo: string;
  data_inicio: Date;
  status: MobilizacaoStatus;
  cont_participantes: number;
  papel: PapelNaAcao;
}

export interface Paginacao {
  pagina?: number;
  limite?: number;
}
