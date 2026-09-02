import { api } from '@services/api';
import type { Mobilizacao, MobilizacaoQuery } from '../types';

function montarParams(query: MobilizacaoQuery): Record<string, string> {
  const params: Record<string, string> = {};
  params.problemaId = String(query.problemaId);
  if (query.pagina) params.pagina = String(query.pagina);
  if (query.limite) params.limite = String(query.limite);
  return params;
}

export async function listarMobilizacoes(query: MobilizacaoQuery): Promise<Mobilizacao[]> {
  const response = await api.get<Mobilizacao[]>('/mobilizacoes', { params: montarParams(query) });
  return response.data;
}

export async function buscarMobilizacao(id: number): Promise<Mobilizacao> {
  const response = await api.get<Mobilizacao>(`/mobilizacoes/${id}`);
  return response.data;
}

export async function criarMobilizacao(input: {
  problemaId: number;
  titulo: string;
  descricao?: string;
  dataInicio: string;
  dataFim?: string;
  localNome?: string;
  lat?: number;
  lng?: number;
}): Promise<Mobilizacao> {
  const response = await api.post<Mobilizacao>('/mobilizacoes', input);
  return response.data;
}

export async function atualizarMobilizacao(
  id: number,
  input: {
    titulo?: string;
    descricao?: string;
    dataInicio?: string;
    dataFim?: string;
    localNome?: string;
    lat?: number;
    lng?: number;
  },
): Promise<Mobilizacao> {
  const response = await api.patch<Mobilizacao>(`/mobilizacoes/${id}`, input);
  return response.data;
}

export async function atualizarStatusMobilizacao(
  id: number,
  status: 'agendada' | 'em_andamento' | 'realizada' | 'cancelada',
): Promise<Mobilizacao> {
  const response = await api.patch<Mobilizacao>(`/mobilizacoes/${id}/status`, { status });
  return response.data;
}

export async function adicionarResultadoMobilizacao(
  id: number,
  input: {
    descricao: string;
    metricas?: Record<string, number>;
    imagens?: string[];
  },
): Promise<Mobilizacao> {
  const response = await api.post<Mobilizacao>(`/mobilizacoes/${id}/resultado`, input);
  return response.data;
}

export async function participarMobilizacao(id: number): Promise<{ participando: boolean; cont_participantes: number }> {
  const response = await api.post<{ participando: boolean; cont_participantes: number }>(`/mobilizacoes/${id}/participar`);
  return response.data;
}

export async function sairMobilizacao(id: number): Promise<{ participando: boolean; cont_participantes: number }> {
  const response = await api.delete<{ participando: boolean; cont_participantes: number }>(`/mobilizacoes/${id}/participar`);
  return response.data;
}