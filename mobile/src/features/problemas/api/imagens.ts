import { uploadFile } from '@services/api';
import type { UploadFileInput } from '@services/api';
import type { ImagemProblema } from '../types';

export async function enviarEvidenciaProblema(
  problemaId: number,
  file: UploadFileInput,
  onProgress?: (progress: number) => void,
): Promise<ImagemProblema> {
  return uploadFile<ImagemProblema>(`/imagens/upload/problema/${problemaId}`, file, onProgress);
}
