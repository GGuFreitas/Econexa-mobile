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

export const statusColors: Record<MobilizacaoStatus, string> = {
  agendada: '#3b82f6', // blue
  em_andamento: '#f59e0b', // amber
  realizada: '#10b981', // emerald
  cancelada: '#ef4444', // red
};