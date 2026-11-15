import { crc32 } from 'node:zlib';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LIMITE_PIXELS_IMAGEM, normalizarImagem } from './imagens.normalizacao.js';

const XMP =
  '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">' +
  '<rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/" dc:creator="MARCADOR-XMP"/>' +
  '</rdf:RDF></x:xmpmeta>';

const EXIF_COM_GPS = {
  IFD0: { Make: 'MARCADOR-FABRICANTE', Model: 'MARCADOR-MODELO', Artist: 'MARCADOR-AUTOR' },
  IFD2: { DateTimeOriginal: '2026:10:27 08:30:00', UserComment: 'MARCADOR-COMENTARIO-EXIF' },
  IFD3: {
    GPSLatitudeRef: 'S',
    GPSLatitude: '23/1 33/1 180/100',
    GPSLongitudeRef: 'W',
    GPSLongitude: '46/1 37/1 5988/100',
    GPSMapDatum: 'MARCADOR-GPS',
  },
};

const MARCADORES_JPEG = [
  'MARCADOR-FABRICANTE',
  'MARCADOR-MODELO',
  'MARCADOR-AUTOR',
  'MARCADOR-COMENTARIO-EXIF',
  'MARCADOR-GPS',
  'MARCADOR-XMP',
  'MARCADOR-IPTC',
  'MARCADOR-COM',
];

const INVALIDA = { statusCode: 415, message: 'O arquivo enviado não é uma imagem válida.' };

function retangulo(largura: number, altura: number, cor = '#3a7d44') {
  return sharp({ create: { width: largura, height: altura, channels: 3, background: cor } });
}

function marcadoresEm(conteudo: Buffer, marcadores: string[]): string[] {
  return marcadores.filter((marcador) => conteudo.includes(Buffer.from(marcador, 'latin1')));
}

function u16(valor: number): Buffer {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16BE(valor);
  return buffer;
}

function u32(valor: number): Buffer {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(valor);
  return buffer;
}

function comIptcEComentario(jpeg: Buffer): Buffer {
  const autor = Buffer.from('MARCADOR-IPTC', 'latin1');
  const iptc = Buffer.concat([Buffer.from([0x1c, 0x02, 0x50]), u16(autor.length), autor]);
  const recurso = Buffer.concat([
    Buffer.from('8BIM\x04\x04\x00\x00', 'latin1'),
    u32(iptc.length),
    iptc,
    Buffer.alloc(iptc.length % 2),
  ]);
  const app13 = Buffer.concat([Buffer.from('Photoshop 3.0\0', 'latin1'), recurso]);
  const comentario = Buffer.from('MARCADOR-COM', 'latin1');

  return Buffer.concat([
    jpeg.subarray(0, 2),
    Buffer.from([0xff, 0xed]),
    u16(app13.length + 2),
    app13,
    Buffer.from([0xff, 0xfe]),
    u16(comentario.length + 2),
    comentario,
    jpeg.subarray(2),
  ]);
}

function comTextoPng(png: Buffer, chave: string, texto: string): Buffer {
  const tipoEDados = Buffer.from(`tEXt${chave}\0${texto}`, 'latin1');
  return Buffer.concat([
    png.subarray(0, 33),
    u32(tipoEDados.length - 4),
    tipoEDados,
    u32(crc32(tipoEDados)),
    png.subarray(33),
  ]);
}

function tagsDoGps(exif: Buffer): number[] {
  const tiff = exif.subarray(6);
  const littleEndian = tiff.toString('latin1', 0, 2) === 'II';
  const ler16 = (pos: number) => (littleEndian ? tiff.readUInt16LE(pos) : tiff.readUInt16BE(pos));
  const ler32 = (pos: number) => (littleEndian ? tiff.readUInt32LE(pos) : tiff.readUInt32BE(pos));
  const entradas = (ifd: number) =>
    Array.from({ length: ler16(ifd) }, (_, i) => ({
      tag: ler16(ifd + 2 + i * 12),
      valor: ler32(ifd + 10 + i * 12),
    }));

  const ponteiroGps = entradas(ler32(4)).find((entrada) => entrada.tag === 0x8825);
  return ponteiroGps ? entradas(ponteiroGps.valor).map((entrada) => entrada.tag) : [];
}

async function canalDominante(imagem: Buffer, x: number, y: number): Promise<'r' | 'g' | 'b'> {
  const { data, info } = await sharp(imagem).raw().toBuffer({ resolveWithObject: true });
  const inicio = (y * info.width + x) * info.channels;
  const [r, g, b] = data.subarray(inicio, inicio + 3);
  if (r > g && r > b) return 'r';
  return g > b ? 'g' : 'b';
}

describe('normalizarImagem', () => {
  it('tira do JPEG o EXIF (com o GPS), o XMP, o IPTC, o ICC e o comentário', async () => {
    const entrada = comIptcEComentario(
      await retangulo(300, 200)
        .jpeg()
        .withExif(EXIF_COM_GPS)
        .withXmp(XMP)
        .withIccProfile('p3')
        .toBuffer(),
    );
    const original = await sharp(entrada).metadata();
    expect(tagsDoGps(original.exif!)).toEqual(expect.arrayContaining([1, 2, 3, 4]));
    expect(original.xmp).toBeDefined();
    expect(original.iptc).toBeDefined();
    expect(original.icc).toBeDefined();
    expect(marcadoresEm(entrada, MARCADORES_JPEG)).toEqual(MARCADORES_JPEG);

    const saida = await normalizarImagem(entrada, 'image/jpeg');
    const normalizada = await sharp(saida).metadata();

    expect(normalizada.format).toBe('jpeg');
    expect([normalizada.width, normalizada.height]).toEqual([300, 200]);
    expect(normalizada.exif).toBeUndefined();
    expect(normalizada.xmp).toBeUndefined();
    expect(normalizada.iptc).toBeUndefined();
    expect(normalizada.icc).toBeUndefined();
    expect(marcadoresEm(saida, ['Exif\0\0', ...MARCADORES_JPEG])).toEqual([]);
  });

  it('aplica a Orientation 6 nos pixels e não deixa a tag na saída', async () => {
    const entrada = await retangulo(300, 200, '#ff0000')
      .composite([
        {
          input: { create: { width: 150, height: 200, channels: 3, background: '#0000ff' } },
          left: 150,
          top: 0,
        },
      ])
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    expect((await sharp(entrada).metadata()).orientation).toBe(6);

    const saida = await normalizarImagem(entrada, 'image/jpeg');
    const normalizada = await sharp(saida).metadata();

    expect([normalizada.width, normalizada.height]).toEqual([200, 300]);
    expect(normalizada.orientation).toBeUndefined();
    expect(normalizada.exif).toBeUndefined();
    expect(await canalDominante(saida, 100, 40)).toBe('r');
    expect(await canalDominante(saida, 100, 260)).toBe('b');
  });

  it.each([
    [4000, 3000, 2048, 1536],
    [3000, 4000, 1536, 2048],
  ])('reduz %ix%i para %ix%i, sem distorcer', async (largura, altura, esperadaL, esperadaA) => {
    const entrada = await retangulo(largura, altura).jpeg().toBuffer();

    const normalizada = await sharp(await normalizarImagem(entrada, 'image/jpeg')).metadata();

    expect([normalizada.width, normalizada.height]).toEqual([esperadaL, esperadaA]);
  });

  it('não amplia imagem que já cabe no limite', async () => {
    const entrada = await retangulo(800, 600).jpeg().toBuffer();

    const normalizada = await sharp(await normalizarImagem(entrada, 'image/jpeg')).metadata();

    expect([normalizada.width, normalizada.height]).toEqual([800, 600]);
  });

  it('mantém PNG como PNG, com transparência, sem EXIF, XMP nem texto', async () => {
    const png = await sharp({
      create: { width: 40, height: 30, channels: 4, background: { r: 20, g: 120, b: 60, alpha: 0.5 } },
    })
      .png()
      .withExif({ IFD0: { Artist: 'MARCADOR-PNG-EXIF' } })
      .withXmp(XMP)
      .toBuffer();
    const entrada = comTextoPng(png, 'Comment', 'MARCADOR-PNG-TEXTO');
    const original = await sharp(entrada).metadata();
    expect(original.exif).toBeDefined();
    expect(original.xmp).toBeDefined();
    expect(original.comments).toContainEqual({ keyword: 'Comment', text: 'MARCADOR-PNG-TEXTO' });

    const saida = await normalizarImagem(entrada, 'image/png');
    const normalizada = await sharp(saida).metadata();

    expect(normalizada.format).toBe('png');
    expect(normalizada.hasAlpha).toBe(true);
    expect(normalizada.exif).toBeUndefined();
    expect(normalizada.xmp).toBeUndefined();
    expect(normalizada.comments).toBeUndefined();
    expect(marcadoresEm(saida, ['MARCADOR-PNG-EXIF', 'MARCADOR-PNG-TEXTO', 'MARCADOR-XMP'])).toEqual([]);
  });

  it('mantém WebP como WebP, sem EXIF nem XMP', async () => {
    const entrada = await retangulo(40, 30)
      .webp()
      .withExif({ IFD0: { Artist: 'MARCADOR-WEBP-EXIF' } })
      .withXmp(XMP)
      .toBuffer();
    const original = await sharp(entrada).metadata();
    expect(original.exif).toBeDefined();
    expect(original.xmp).toBeDefined();

    const saida = await normalizarImagem(entrada, 'image/webp');
    const normalizada = await sharp(saida).metadata();

    expect(normalizada.format).toBe('webp');
    expect(normalizada.exif).toBeUndefined();
    expect(normalizada.xmp).toBeUndefined();
    expect(marcadoresEm(saida, ['MARCADOR-WEBP-EXIF', 'MARCADOR-XMP'])).toEqual([]);
  });
});

describe('normalizarImagem: o que não vira foto', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('recusa com 415 bytes com assinatura de JPEG que não decodificam, e loga o motivo', async () => {
    const falso = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);

    await expect(normalizarImagem(falso, 'image/jpeg')).rejects.toMatchObject(INVALIDA);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringMatching(/^Imagem recusada na normalização: .+/),
    );
  });

  it('recusa com 415 um JPEG truncado', async () => {
    const jpeg = await retangulo(800, 600).jpeg().toBuffer();

    await expect(
      normalizarImagem(jpeg.subarray(0, Math.floor(jpeg.length / 2)), 'image/jpeg'),
    ).rejects.toMatchObject(INVALIDA);
  });

  it('recusa com 415 imagem válida acima do limite de pixels', async () => {
    const enorme = await retangulo(7100, 7100).jpeg().toBuffer();
    const { width, height } = await sharp(enorme).metadata();
    expect(width * height).toBeGreaterThan(LIMITE_PIXELS_IMAGEM);
    await expect(sharp(enorme).resize(2048).jpeg().toBuffer()).resolves.toBeInstanceOf(Buffer);

    await expect(normalizarImagem(enorme, 'image/jpeg')).rejects.toMatchObject(INVALIDA);
  });

  it('recusa com 415 tipo que ela não sabe regravar', async () => {
    const jpeg = await retangulo(10, 10).jpeg().toBuffer();

    await expect(normalizarImagem(jpeg, 'image/gif')).rejects.toMatchObject({
      statusCode: 415,
      message: 'Envie uma imagem JPEG, PNG ou WebP.',
    });
  });
});
