import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { enviarEvidenciaProblema } from '../api/imagens';
import type { UploadFileInput } from '@services/api';

export function useEnviarEvidencia(problemaId: number) {
  const qc = useQueryClient();
  const [progresso, setProgresso] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: (file: UploadFileInput) => {
      setProgresso(0);
      return enviarEvidenciaProblema(problemaId, file, setProgresso);
    },
    onSettled: () => setProgresso(null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['imagens', 'problema', problemaId] });
      qc.invalidateQueries({ queryKey: ['eventos', problemaId] });
    },
  });

  return { ...mutation, progresso };
}
