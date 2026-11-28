import type { PapelStatus } from '@shared/ui/PilulaStatus';
import type { EncaminhamentoStatus } from '../types';

export const statusLabels: Record<EncaminhamentoStatus, string> = {
  pendente: 'Aguardando envio',
  enviado: 'Enviado ao órgão',
  respondido: 'Respondido',
  falhou: 'Falha no envio',
};

const PAPEL: Record<EncaminhamentoStatus, PapelStatus> = {
  pendente: 'atencao',
  enviado: 'andamento',
  respondido: 'sucesso',
  falhou: 'erro',
};

const ICONE: Record<EncaminhamentoStatus, string> = {
  pendente: 'clock-outline',
  enviado: 'send-outline',
  respondido: 'check-circle-outline',
  falhou: 'alert-circle-outline',
};

export function rotuloStatusEncaminhamento(status: EncaminhamentoStatus): string {
  return statusLabels[status] ?? status;
}

/** Papel semântico do status (a cor vem do tema, nunca fixa). */
export function papelStatusEncaminhamento(status: EncaminhamentoStatus): PapelStatus {
  return PAPEL[status] ?? 'neutro';
}

export function iconeStatusEncaminhamento(status: EncaminhamentoStatus): string {
  return ICONE[status] ?? 'help-circle-outline';
}

export function opcoesDeOrgao(
  orgaos: { id: number; nome: string; esfera: string }[] = [],
): { label: string; value: number }[] {
  return orgaos.map((orgao) => ({ label: `${orgao.nome} (${orgao.esfera})`, value: orgao.id }));
}

export const AVISO_RESPOSTA_NAO_VERIFICADA =
  'O Mutira não confirma esta resposta junto ao órgão: é o relato de quem encaminhou.';

export function rotuloDoRelato(autor: string): string {
  const nome = autor?.trim();
  return nome ? `Resposta relatada por ${nome}` : 'Resposta relatada pelo cidadão';
}
