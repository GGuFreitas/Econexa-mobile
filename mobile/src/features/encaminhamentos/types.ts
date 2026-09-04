export type EncaminhamentoStatus = 'pendente' | 'enviado' | 'respondido' | 'falhou';

export interface Orgao {
  id: number;
  nome: string;
  esfera: string;
  tipo: string;
}

export interface Encaminhamento {
  id: number;
  problema_id: number;
  referencia: string;
  assunto: string;
  mensagem: string;
  status: EncaminhamentoStatus;
  enviado_em: string | null;
  protocolo: string | null;
  resposta: string | null;
  respondido_em: string | null;
  criado_em: string;
  orgao: Orgao;
  autor: { id: number; nome: string };
  pode_registrar_resposta: boolean;
}

export interface CriarEncaminhamentoPayload {
  orgaoId: number;
  mensagem?: string;
}

export interface RegistrarRespostaPayload {
  encaminhamentoId: number;
  resposta: string;
  protocolo?: string;
}
