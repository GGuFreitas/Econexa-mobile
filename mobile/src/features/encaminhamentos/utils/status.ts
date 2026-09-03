import type { EncaminhamentoStatus } from '../types';

export const statusLabels: Record<EncaminhamentoStatus, string> = {
  pendente: 'Aguardando envio',
  enviado: 'Enviado ao órgão',
  respondido: 'Respondido',
  falhou: 'Falha no envio',
};

export const statusColors: Record<EncaminhamentoStatus, string> = {
  pendente: '#f59e0b',
  enviado: '#3b82f6',
  respondido: '#10b981',
  falhou: '#ef4444',
};

export function rotuloStatusEncaminhamento(status: EncaminhamentoStatus): string {
  return statusLabels[status] ?? status;
}

export function corStatusEncaminhamento(status: EncaminhamentoStatus): string {
  return statusColors[status] ?? '#6b7280';
}

export function opcoesDeOrgao(
  orgaos: { id: number; nome: string; esfera: string }[] = [],
): { label: string; value: number }[] {
  return orgaos.map((orgao) => ({ label: `${orgao.nome} (${orgao.esfera})`, value: orgao.id }));
}
