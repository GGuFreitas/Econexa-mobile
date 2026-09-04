import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { enviarObjeto, removerObjeto } from '@shared/storage.js';
import {
  criarProblemaNoBanco,
  criarUsuario,
  encerrarBanco,
  limparBanco,
  tiposDeEvento,
} from '../../tests/integracao/fixtures.js';
import { apoiarProblema, desapoiarProblema } from '@common/apoios/apoios.handler.js';
import { obterProblema } from '@common/problemas/problemas.handler.js';
import { enviarEvidenciaProblema } from './imagens.handler.js';

vi.mock('@shared/storage.js', () => ({
  enviarObjeto: vi.fn(),
  removerObjeto: vi.fn(),
}));

const mockEnviarObjeto = vi.mocked(enviarObjeto);
const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);

describe('evidência: autor, quem apoiou e moderação', () => {
  let autor: number;
  let problemaId: number;

  beforeEach(async () => {
    await limparBanco();
    vi.mocked(removerObjeto).mockReset();
    mockEnviarObjeto.mockReset();
    mockEnviarObjeto.mockResolvedValue('http://minio/evidencia.jpg');
    autor = await criarUsuario('Tais Autora');
    problemaId = await criarProblemaNoBanco({ usuarioId: autor });
  });

  afterAll(encerrarBanco);

  it('quem apoiou o problema consegue subir evidência', async () => {
    const apoiador = await criarUsuario('Ulisses');
    await apoiarProblema(problemaId, apoiador);

    const imagem = await enviarEvidenciaProblema({
      problemaId,
      usuarioId: apoiador,
      role: 'citizen',
      nomeArquivo: 'foto.jpg',
      mimetype: 'image/jpeg',
      conteudo: jpeg,
    });

    expect(imagem.entidade_id).toBe(problemaId);
    expect(await tiposDeEvento(problemaId)).toContain('EVIDENCIA_ADICIONADA');
  });

  it('quem não tem relação com o problema recebe 403 antes do storage', async () => {
    const estranho = await criarUsuario('Vera');

    await expect(
      enviarEvidenciaProblema({
        problemaId,
        usuarioId: estranho,
        role: 'citizen',
        nomeArquivo: 'foto.jpg',
        mimetype: 'image/jpeg',
        conteudo: jpeg,
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(mockEnviarObjeto).not.toHaveBeenCalled();
  });

  it('quem retirou o apoio perde o direito de subir evidência', async () => {
    const apoiador = await criarUsuario('Wagner');
    await apoiarProblema(problemaId, apoiador);
    await desapoiarProblema(problemaId, apoiador);

    await expect(
      enviarEvidenciaProblema({
        problemaId,
        usuarioId: apoiador,
        role: 'citizen',
        nomeArquivo: 'foto.jpg',
        mimetype: 'image/jpeg',
        conteudo: jpeg,
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('o autor sobe evidência sem precisar apoiar o próprio problema', async () => {
    const imagem = await enviarEvidenciaProblema({
      problemaId,
      usuarioId: autor,
      role: 'citizen',
      nomeArquivo: 'foto.jpg',
      mimetype: 'image/jpeg',
      conteudo: jpeg,
    });

    expect(imagem.principal).toBe(true);
  });

  it('o detalhe anuncia pode_adicionar_evidencia separado de pode_encaminhar', async () => {
    const apoiador = await criarUsuario('Xuxa');
    await apoiarProblema(problemaId, apoiador);

    const paraApoiador = await obterProblema(problemaId, apoiador, 'citizen');
    const paraAutor = await obterProblema(problemaId, autor, 'citizen');
    const paraEstranho = await obterProblema(problemaId, await criarUsuario('Yuri'), 'citizen');

    expect(paraApoiador.pode_adicionar_evidencia).toBe(true);
    expect(paraApoiador.pode_encaminhar).toBe(false);
    expect(paraAutor.pode_adicionar_evidencia).toBe(true);
    expect(paraAutor.pode_encaminhar).toBe(true);
    expect(paraEstranho.pode_adicionar_evidencia).toBe(false);
  });
});
