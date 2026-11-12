import sharp, { type Sharp } from 'sharp';
import { AppError } from '@shared/errors.js';

const LADO_MAXIMO_IMAGEM = 2048;

export const LIMITE_PIXELS_IMAGEM = 50_000_000;

const QUALIDADE = 85;

const GRAVAR_POR_MIME: Record<string, (imagem: Sharp) => Sharp> = {
  'image/jpeg': (imagem) => imagem.jpeg({ quality: QUALIDADE }),
  'image/png': (imagem) => imagem.png(),
  'image/webp': (imagem) => imagem.webp({ quality: QUALIDADE }),
};

export async function normalizarImagem(conteudo: Buffer, mimetype: string): Promise<Buffer> {
  const gravar = GRAVAR_POR_MIME[mimetype];
  if (!gravar) {
    throw new AppError('Envie uma imagem JPEG, PNG ou WebP.', 415);
  }

  try {
    const imagem = sharp(conteudo, { limitInputPixels: LIMITE_PIXELS_IMAGEM })
      .rotate()
      .resize({
        width: LADO_MAXIMO_IMAGEM,
        height: LADO_MAXIMO_IMAGEM,
        fit: 'inside',
        withoutEnlargement: true,
      });
    return await gravar(imagem).toBuffer();
  } catch (erro) {
    const motivo = erro instanceof Error ? erro.message : String(erro);
    console.warn(`Imagem recusada na normalização: ${motivo}`);
    throw new AppError('O arquivo enviado não é uma imagem válida.', 415);
  }
}
