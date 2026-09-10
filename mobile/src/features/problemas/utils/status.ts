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
