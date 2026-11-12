import sharp from 'sharp';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
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
import { enviarEvidenciaProblema, listImagens } from './imagens.handler.js';

vi.mock('@shared/storage.js', () => ({
  enviarObjeto: vi.fn(),
  removerObjeto: vi.fn(),
}));

const mockEnviarObjeto = vi.mocked(enviarObjeto);

const XMP =
  '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">' +
  '<rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/" dc:creator="MARCADOR-XMP"/>' +
  '</rdf:RDF></x:xmpmeta>';
const MARCADORES = ['MARCADOR-FABRICANTE', 'MARCADOR-MODELO', 'MARCADOR-GPS', 'MARCADOR-XMP'];

let foto: Buffer;
let fotoComLocalizacao: Buffer;

beforeAll(async () => {
  const quadro = sharp({ create: { width: 640, height: 480, channels: 3, background: '#3a7d44' } });
  foto = await quadro.clone().jpeg().toBuffer();
  fotoComLocalizacao = await quadro
    .clone()
    .jpeg()
    .withExif({
      IFD0: { Make: 'MARCADOR-FABRICANTE', Model: 'MARCADOR-MODELO' },
      IFD3: {
        GPSLatitudeRef: 'S',
        GPSLatitude: '23/1 33/1 180/100',
        GPSLongitudeRef: 'W',
        GPSLongitude: '46/1 37/1 5988/100',
        GPSMapDatum: 'MARCADOR-GPS',
      },
    })
    .withXmp(XMP)
    .toBuffer();
});

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

  afterEach(() => {
    vi.restoreAllMocks();
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
      conteudo: foto,
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
        conteudo: foto,
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
        conteudo: foto,
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
      conteudo: foto,
    });

    expect(imagem.principal).toBe(true);
  });

  it('o que chega ao storage é a foto sem EXIF, sem GPS e sem XMP', async () => {
    const original = await sharp(fotoComLocalizacao).metadata();
    expect(original.exif?.includes(Buffer.from('MARCADOR-GPS'))).toBe(true);
    expect(original.xmp).toBeDefined();

    const imagem = await enviarEvidenciaProblema({
      problemaId,
      usuarioId: autor,
      role: 'citizen',
      nomeArquivo: 'foto.jpg',
      mimetype: 'image/jpeg',
      conteudo: fotoComLocalizacao,
    });

    expect(mockEnviarObjeto).toHaveBeenCalledTimes(1);
    const [chave, enviado, tipo] = mockEnviarObjeto.mock.calls[0];
    const gravada = await sharp(enviado).metadata();
    expect(chave).toMatch(new RegExp(`^problema/${problemaId}/[0-9a-f-]{36}\\.jpg$`));
    expect(tipo).toBe('image/jpeg');
    expect(gravada.format).toBe('jpeg');
    expect([gravada.width, gravada.height]).toEqual([640, 480]);
    expect(gravada.exif).toBeUndefined();
    expect(gravada.xmp).toBeUndefined();
    expect(MARCADORES.filter((marcador) => enviado.includes(Buffer.from(marcador)))).toEqual([]);
    expect(await listImagens('problema', problemaId)).toEqual([
      expect.objectContaining({ id: imagem.id, url: 'http://minio/evidencia.jpg' }),
    ]);
  });

  it('arquivo com assinatura de JPEG que não decodifica recebe 415 e não deixa rastro', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const falso = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);

    await expect(
      enviarEvidenciaProblema({
        problemaId,
        usuarioId: autor,
        role: 'citizen',
        nomeArquivo: 'foto.jpg',
        mimetype: 'image/jpeg',
        conteudo: falso,
      }),
    ).rejects.toMatchObject({ statusCode: 415 });
    expect(mockEnviarObjeto).not.toHaveBeenCalled();
    expect(await listImagens('problema', problemaId)).toEqual([]);
    expect(await tiposDeEvento(problemaId)).not.toContain('EVIDENCIA_ADICIONADA');
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
