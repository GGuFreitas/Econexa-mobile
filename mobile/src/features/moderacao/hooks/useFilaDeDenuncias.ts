import { useQuery } from '@tanstack/react-query';
import { listarProblemasDenunciados } from '../api/listarDenuncias';
import { CHAVE_DA_FILA } from './chaves';

export function useFilaDeDenuncias() {
  return useQuery({
    queryKey: CHAVE_DA_FILA,
    queryFn: listarProblemasDenunciados,
    staleTime: 15_000,
  });
}
