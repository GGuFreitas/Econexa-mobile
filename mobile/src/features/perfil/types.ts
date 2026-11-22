import type { MobilizacaoStatus } from '@features/mobilizations/types';

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
  enviado_em: string;
  dias: number;
}

export interface AvisoAcaoProxima {
  tipo: 'acao_proxima';
  mobilizacao_id: number;
  problema_id: number;
  titulo: string;
  data_inicio: string;
  cont_participantes: number;
  papel: PapelNaAcao;
}

export type Aviso = AvisoPertoDaMeta | AvisoSemResposta | AvisoAcaoProxima;

export interface ResumoDoUsuario {
  membro_desde: string;
  relatados: number;
  apoios_dados: number;
  apoios_recebidos: number;
  acoes: number;
  avisos: Aviso[];
}

export interface AcaoDoUsuario {
  id: number;
  problema_id: number;
  problema_titulo: string;
  titulo: string;
  data_inicio: string;
  status: MobilizacaoStatus;
  cont_participantes: number;
  papel: PapelNaAcao;
}
