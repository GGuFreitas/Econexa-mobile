export type EncaminhamentoStatus = 'pendente' | 'enviado' | 'respondido' | 'falhou';

export interface Orgao {
  id: number;
  nome: string;
  email: string;
  esfera: string;
  tipo: string;
  ativo: boolean;
}

export interface OrgaoPublico {
  id: number;
  nome: string;
  esfera: string;
  tipo: string;
}

export interface EncaminhamentoRow {
  id: number;
  problema_id: number;
  orgao_id: number;
  usuario_id: number;
  referencia: string;
  assunto: string;
  mensagem: string;
  status: EncaminhamentoStatus;
  enviado_em: Date | string | null;
  protocolo: string | null;
  resposta: string | null;
  respondido_em: Date | string | null;
  criado_em: Date | string;
  atualizado_em: Date | string;
  orgao_nome: string;
  orgao_esfera: string;
  orgao_tipo: string;
  autor_nome: string;
}

export interface Encaminhamento {
  id: number;
  problema_id: number;
  referencia: string;
  assunto: string;
  mensagem: string;
  status: EncaminhamentoStatus;
  enviado_em: Date | string | null;
  protocolo: string | null;
  resposta: string | null;
  respondido_em: Date | string | null;
  criado_em: Date | string;
  orgao: OrgaoPublico;
  autor: { id: number; nome: string };
  pode_registrar_resposta: boolean;
}

export interface CriarEncaminhamentoInput {
  problemaId: number;
  orgaoId: number;
  mensagem?: string;
  usuarioId: number;
  role: string;
}

export interface RegistrarRespostaInput {
  problemaId: number;
  encaminhamentoId: number;
  resposta: string;
  protocolo?: string;
  usuarioId: number;
  role: string;
}

export interface ListarEncaminhamentosInput {
  problemaId: number;
  usuarioId: number;
  role: string;
}

export interface InserirEncaminhamentoInput {
  problemaId: number;
  orgaoId: number;
  usuarioId: number;
  referencia: string;
  assunto: string;
  mensagem: string;
}
