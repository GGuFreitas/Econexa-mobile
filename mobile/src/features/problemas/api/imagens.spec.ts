import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@services/api', () => ({
  uploadFile: vi.fn(),
}));

import { uploadFile } from '@services/api';
import { enviarEvidenciaProblema } from './imagens';

describe('enviarEvidenciaProblema', () => {
  beforeEach(() => vi.clearAllMocks());

  it('envia o arquivo para a rota de upload do problema', async () => {
    vi.mocked(uploadFile).mockResolvedValue({
      id: 7,
      tipo_entidade: 'problema',
      entidade_id: 3,
      url: 'http://localhost:9000/econexa-evidencias/problema/3/foto.jpg',
      principal: true,
      ordem: 0,
      criado_em: '2026-09-03T10:00:00.000Z',
    });

    const arquivo = { uri: 'file:///foto.jpg', name: 'foto.jpg', type: 'image/jpeg' };
    const onProgress = vi.fn();
    const imagem = await enviarEvidenciaProblema(3, arquivo, onProgress);

    expect(uploadFile).toHaveBeenCalledWith('/imagens/upload/problema/3', arquivo, onProgress);
    expect(imagem.url).toContain('problema/3');
  });

  it('propaga a recusa do servidor', async () => {
    vi.mocked(uploadFile).mockRejectedValue(new Error('Envie uma imagem JPEG, PNG ou WebP.'));

    await expect(
      enviarEvidenciaProblema(3, { uri: 'file:///a.pdf', name: 'a.pdf', type: 'application/pdf' }),
    ).rejects.toThrow('Envie uma imagem JPEG, PNG ou WebP.');
  });
});
