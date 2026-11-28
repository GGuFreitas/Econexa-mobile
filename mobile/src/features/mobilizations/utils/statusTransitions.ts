import type { PapelStatus } from '@shared/ui/PilulaStatus';
import type { MobilizacaoStatus } from '../types';

const allowedTransitions: Record<MobilizacaoStatus, MobilizacaoStatus[]> = {
  agendada: ['em_andamento', 'cancelada'],
  em_andamento: ['realizada', 'cancelada'],
  realizada: [],
  cancelada: [],
};

export function canTransition(from: MobilizacaoStatus, to: MobilizacaoStatus): boolean {
  return allowedTransitions[from]?.includes(to) ?? false;
}

export function getAvailableTransitions(status: MobilizacaoStatus): MobilizacaoStatus[] {
  return allowedTransitions[status] ?? [];
}

export const statusLabels: Record<MobilizacaoStatus, string> = {
  agendada: 'Agendada',
  em_andamento: 'Em andamento',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
};

/** Papel semântico de cada status (a cor vem do tema, nunca fixa). */
export const statusPapeis: Record<MobilizacaoStatus, PapelStatus> = {
  agendada: 'andamento',
  em_andamento: 'atencao',
  realizada: 'sucesso',
  cancelada: 'neutro',
};

export const statusIcones: Record<MobilizacaoStatus, string> = {
  agendada: 'calendar-clock',
  em_andamento: 'progress-clock',
  realizada: 'check-circle-outline',
  cancelada: 'close-circle-outline',
};