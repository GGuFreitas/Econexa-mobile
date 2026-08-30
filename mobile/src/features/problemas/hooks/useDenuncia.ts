import { useMutation, useQueryClient } from '@tanstack/react-query';
import { criarDenuncia } from '../api/denuncias';
import type { DenunciaMotivo } from '../types';

export function useDenuncia(problemaId: number) {
  return useMutation({
    mutationFn: (motivo: DenunciaMotivo) => criarDenuncia(problemaId, motivo),
  });
}
