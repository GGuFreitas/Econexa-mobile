import { uploadFile } from '@services/api';
import type { UploadFileInput } from '@services/api';

export async function uploadImagemProblema(
  problemaId: number,
  file: UploadFileInput,
  onProgress?: (progress: number) => void,
): Promise<{ url: string }> {
  return uploadFile(`/imagens/upload/problema/${problemaId}`, file, onProgress);
}