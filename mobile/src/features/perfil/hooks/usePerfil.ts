import { useQuery } from '@tanstack/react-query';
import { obterResumo } from '../api/resumo';
import { listarRelatados } from '../api/relatados';
import { listarApoiados } from '../api/apoiados';
import { listarAcoes } from '../api/acoes';
import { listarIdsApoiados } from '../api/apoios';

const STALE = 30_000;

export const CHAVE_MEUS_APOIOS = ['me', 'apoios'] as const;

export function useMeusApoios() {
  return useQuery({ queryKey: CHAVE_MEUS_APOIOS, queryFn: listarIdsApoiados, staleTime: STALE });
}

export function useResumo() {
  return useQuery({ queryKey: ['me', 'resumo'], queryFn: obterResumo, staleTime: STALE });
}

export function useRelatados() {
  return useQuery({ queryKey: ['me', 'relatados'], queryFn: () => listarRelatados(), staleTime: STALE });
}

export function useApoiados() {
  return useQuery({ queryKey: ['me', 'apoiados'], queryFn: () => listarApoiados(), staleTime: STALE });
}

export function useAcoes() {
  return useQuery({ queryKey: ['me', 'acoes'], queryFn: () => listarAcoes(), staleTime: STALE });
}
