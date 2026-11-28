import { STATUS_LABEL } from './eventos';
import type { ProblemaStatus } from '../types';

export interface OpcaoStatus {
  label: string;
  value: ProblemaStatus;
}

export function opcoesDeStatus(transicoes: ProblemaStatus[] = []): OpcaoStatus[] {
  return transicoes.map((status) => ({ label: STATUS_LABEL[status] ?? status, value: status }));
}

export function rotuloStatus(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

/** Caminho de um problema até o resultado, na ordem. */
export const ETAPAS_STATUS: ProblemaStatus[] = ['ativo', 'em_analise', 'encaminhado', 'resolvido'];

const ICONE_STATUS: Record<string, string> = {
  ativo: 'flag-outline',
  em_analise: 'clock-outline',
  encaminhado: 'send-outline',
  resolvido: 'check-circle-outline',
  removido: 'close-circle-outline',
};

/** Ícone do status (status nunca é dito só por cor). */
export function iconeStatus(status: string): string {
  return ICONE_STATUS[status] ?? 'flag-outline';
}
