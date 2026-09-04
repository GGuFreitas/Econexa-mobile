import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listarEventosProblema } from '../api/listarEventos';
import { apresentarEventos } from '../utils/eventos';
import type { EventoApresentado, ProblemaEvento } from '../types';

const LIMITE_EVENTOS = 50;

interface TimelineResultado {
  eventos: EventoApresentado[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
}

export function useTimeline(problemaId: number | null): TimelineResultado {
  const query = useQuery<ProblemaEvento[]>({
    queryKey: ['eventos', problemaId],
    queryFn: () => listarEventosProblema(problemaId as number, LIMITE_EVENTOS),
    enabled: problemaId != null,
    staleTime: 30_000,
  });

  const eventos = useMemo(() => apresentarEventos(query.data), [query.data]);

  return {
    eventos,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => {
      query.refetch();
    },
  };
}
