import { useQuery } from '@tanstack/react-query';
import { listarOrgaos } from '../api/listarOrgaos';
import type { Orgao } from '../types';

const CINCO_MINUTOS = 5 * 60_000;

export function useOrgaos(habilitado: boolean) {
  return useQuery<Orgao[]>({
    queryKey: ['orgaos'],
    queryFn: listarOrgaos,
    enabled: habilitado,
    staleTime: CINCO_MINUTOS,
  });
}
