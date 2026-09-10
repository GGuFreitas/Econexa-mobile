import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dbPool } from '@config/database.js';
import { enviarObjeto, removerObjeto } from '@shared/storage.js';
import {
  enviarEvidenciaProblema,
  TAMANHO_MAXIMO_IMAGEM,
  validarArquivoImagem,
} from './imagens.handler.js';

vi.mock('@config/database.js', () => ({
  dbPool: { query: vi.fn() },
}));

vi.mock('@shared/transacao.js', async () => {
  const { dbPool: pool } = await import('@config/database.js');
  return { emTransacao: (fn: (executor: unknown) => unknown) => fn(pool) };
});

vi.mock('@shared/storage.js', () => ({
  enviarObjeto: vi.fn(),
  removerObjeto: vi.fn(),
}));

const mockQuery = dbPool.query as unknown as ReturnType<typeof vi.fn>;
const mockEnviarObjeto = vi.mocked(enviarObjeto);
const mockRemoverObjeto = vi.mocked(removerObjeto);

const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(64),
]);
const webp = Buffer.concat([
  Buffer.from('RIFF', 'ascii'),
  Buffer.alloc(4),
  Buffer.from('WEBP', 'ascii'),
  Buffer.alloc(64),
]);

const problemaDoAutor = { id: 5, usuario_id: 7, status: 'ativo' };

describe('validarArquivoImagem', () => {
  it('aceita JPEG, PNG e WebP com assinatura coerente', () => {
    expect(() => validarArquivoImagem('image/jpeg', jpeg)).not.toThrow();
    expect(() => validarArquivoImagem('image/png', png)).not.toThrow();
    expect(() => validarArquivoImagem('image/webp', webp)).not.toThrow();
  });

  it('recusa tipo que não é imagem', () => {
    expect(() => validarArquivoImagem('application/pdf', jpeg)).toThrow(
      'Envie uma imagem JPEG, PNG ou WebP.',
    );
  });

  it('recusa arquivo vazio', () => {
    expect(() => validarArquivoImagem('image/jpeg', Buffer.alloc(0))).toThrow(
      'O arquivo enviado está vazio.',
    );
  });

  it('recusa arquivo acima do tamanho máximo', () => {
    const grande = Buffer.concat([jpeg, Buffer.alloc(TAMANHO_MAXIMO_IMAGEM)]);
    expect(() => validarArquivoImagem('image/jpeg', grande)).toThrow(
      'A imagem deve ter no máximo 5 MB.',
    );
  });

  it('recusa arquivo que se declara imagem mas não tem assinatura de imagem', () => {
    expect(() => validarArquivoImagem('image/png', Buffer.from('nao sou imagem'))).toThrow(
      'O arquivo enviado não é uma imagem válida.',
    );
  });
});

describe('enviarEvidenciaProblema', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockEnviarObjeto.mockReset();
    mockRemoverObjeto.mockReset();
  });

  it('sobe a imagem, registra a evidência e emite EVIDENCIA_ADICIONADA', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [problemaDoAutor] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockResolvedValueOnce({ rows: [{ id: 12, url: 'http://minio/evidencia.jpg', principal: true }] })
      .mockResolvedValueOnce({ rows: [{ id: 80 }] });
    mockEnviarObjeto.mockResolvedValue('http://minio/evidencia.jpg');

    const imagem = await enviarEvidenciaProblema({
      problemaId: 5,
      usuarioId: 7,
      role: 'citizen',
      nomeArquivo: 'foto.jpg',
      mimetype: 'image/jpeg',
      conteudo: jpeg,
    });

    expect(imagem.id).toBe(12);
    expect(mockEnviarObjeto.mock.calls[0][0]).toMatch(/^problema\/5\/.+\.jpg$/);
    expect(mockQuery.mock.calls[2][0]).toContain('INSERT INTO imagens');
    expect(mockQuery.mock.calls[3][1]).toEqual([
      5,
      'EVIDENCIA_ADICIONADA',
      7,
      JSON.stringify({ imagem_id: 12, url: 'http://minio/evidencia.jpg' }),
    ]);
  });

  it('aceita evidência de quem apoiou o problema', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [problemaDoAutor] })
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] })
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 14, url: 'http://minio/apoiador.jpg' }] })
      .mockResolvedValueOnce({ rows: [{ id: 82 }] });
    mockEnviarObjeto.mockResolvedValue('http://minio/apoiador.jpg');

    const imagem = await enviarEvidenciaProblema({
      problemaId: 5,
      usuarioId: 99,
      role: 'citizen',
      nomeArquivo: 'foto.jpg',
      mimetype: 'image/jpeg',
      conteudo: jpeg,
    });

    expect(imagem.id).toBe(14);
    expect(mockQuery.mock.calls[1][0]).toContain('FROM problema_apoios');
    expect(mockQuery.mock.calls[4][1]?.[2]).toBe(99);
  });

  it('recusa evidência de quem não é autor, não apoiou e não modera, antes de tocar no storage', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [problemaDoAutor] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(
      enviarEvidenciaProblema({
        problemaId: 5,
        usuarioId: 99,
        role: 'citizen',
        nomeArquivo: 'foto.jpg',
        mimetype: 'image/jpeg',
        conteudo: jpeg,
      }),
    ).rejects.toThrow('Apoie este problema para poder adicionar evidência a ele.');
    expect(mockEnviarObjeto).not.toHaveBeenCalled();
  });

  it('aceita evidência da moderação em problema de outra pessoa', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [problemaDoAutor] })
      .mockResolvedValueOnce({ rows: [{ total: 2 }] })
      .mockResolvedValueOnce({ rows: [{ id: 13, url: 'http://minio/evidencia.png' }] })
      .mockResolvedValueOnce({ rows: [{ id: 81 }] });
    mockEnviarObjeto.mockResolvedValue('http://minio/evidencia.png');

    const imagem = await enviarEvidenciaProblema({
      problemaId: 5,
      usuarioId: 99,
      role: 'admin',
      nomeArquivo: 'foto.png',
      mimetype: 'image/png',
      conteudo: png,
    });

    expect(imagem.id).toBe(13);
    expect(mockQuery.mock.calls[2][1]).toEqual([
      'problema',
      5,
      'http://minio/evidencia.png',
      false,
      2,
    ]);
  });

  it('recusa evidência em problema inexistente', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(
      enviarEvidenciaProblema({
        problemaId: 999,
        usuarioId: 7,
        role: 'citizen',
        nomeArquivo: 'foto.jpg',
        mimetype: 'image/jpeg',
        conteudo: jpeg,
      }),
    ).rejects.toThrow('Problema não encontrado.');
    expect(mockEnviarObjeto).not.toHaveBeenCalled();
  });

  it('valida o arquivo antes de consultar o problema', async () => {
    await expect(
      enviarEvidenciaProblema({
        problemaId: 5,
        usuarioId: 7,
        role: 'citizen',
        nomeArquivo: 'documento.pdf',
        mimetype: 'application/pdf',
        conteudo: jpeg,
      }),
    ).rejects.toThrow('Envie uma imagem JPEG, PNG ou WebP.');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('remove o objeto do storage quando a persistência falha', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [problemaDoAutor] })
      .mockResolvedValueOnce({ rows: [{ total: 0 }] })
      .mockRejectedValueOnce(new Error('falha no insert'));
    mockEnviarObjeto.mockResolvedValue('http://minio/evidencia.jpg');

    await expect(
      enviarEvidenciaProblema({
        problemaId: 5,
        usuarioId: 7,
        role: 'citizen',
        nomeArquivo: 'foto.jpg',
        mimetype: 'image/jpeg',
        conteudo: jpeg,
      }),
    ).rejects.toThrow('falha no insert');
    expect(mockRemoverObjeto).toHaveBeenCalledTimes(1);
  });
});
