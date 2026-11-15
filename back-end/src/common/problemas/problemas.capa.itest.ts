import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { dbPool } from '@config/database.js';
import { enviarObjeto } from '@shared/storage.js';
import {
  criarProblemaNoBanco,
  criarUsuario,
  encerrarBanco,
  limparBanco,
} from '../../tests/integracao/fixtures.js';
import { enviarEvidenciaProblema } from '@common/imagens/imagens.handler.js';
import { invalidarCacheDeProblemas, listarProblemas } from './problemas.handler.js';

vi.mock('@shared/storage.js', () => ({
  enviarObjeto: vi.fn(),
  removerObjeto: vi.fn(),
}));

const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);

async function inserirImagem(
  tipoEntidade: string,
  entidadeId: number,
  url: string,
  principal: boolean,
  ordem: number,
): Promise<void> {
  await dbPool.query(
    `INSERT INTO imagens (tipo_entidade, entidade_id, url, principal, ordem)
     VALUES ($1, $2, $3, $4, $5)`,
    [tipoEntidade, entidadeId, url, principal, ordem],
  );
}

describe('problemas: capa na listagem', () => {
  let autor: number;

  beforeEach(async () => {
    await limparBanco();
    await invalidarCacheDeProblemas();
    vi.mocked(enviarObjeto).mockReset();
    autor = await criarUsuario('Bia Capa');
  });

  afterAll(encerrarBanco);

  it('problema sem foto sai com capa_url nula e nenhuma imagem', async () => {
    await criarProblemaNoBanco({ usuarioId: autor });

    const [problema] = await listarProblemas({});

    expect(problema.capa_url).toBeNull();
    expect(problema.cont_imagens).toBe(0);
  });

  it('a capa é a imagem principal, mesmo fora da primeira posição', async () => {
    const id = await criarProblemaNoBanco({ usuarioId: autor });
    await inserirImagem('problema', id, 'http://minio/segunda.jpg', false, 0);
    await inserirImagem('problema', id, 'http://minio/principal.jpg', true, 1);
    await inserirImagem('problema', id, 'http://minio/terceira.jpg', false, 2);

    const [problema] = await listarProblemas({});

    expect(problema.capa_url).toBe('http://minio/principal.jpg');
    expect(problema.cont_imagens).toBe(3);
  });

  it('sem principal, a capa é a de menor ordem', async () => {
    const id = await criarProblemaNoBanco({ usuarioId: autor });
    await inserirImagem('problema', id, 'http://minio/depois.jpg', false, 1);
    await inserirImagem('problema', id, 'http://minio/antes.jpg', false, 0);

    const [problema] = await listarProblemas({});

    expect(problema.capa_url).toBe('http://minio/antes.jpg');
  });

  it('imagens de outro problema ou de outra entidade com o mesmo id não entram', async () => {
    const comFoto = await criarProblemaNoBanco({ usuarioId: autor, titulo: 'Com foto' });
    const semFoto = await criarProblemaNoBanco({ usuarioId: autor, titulo: 'Sem foto' });
    await inserirImagem('problema', comFoto, 'http://minio/dele.jpg', true, 0);
    await inserirImagem('mobilizacao', semFoto, 'http://minio/mobilizacao.jpg', true, 0);

    const lista = await listarProblemas({});
    const porTitulo = Object.fromEntries(lista.map((p) => [p.titulo, p]));

    expect(porTitulo['Com foto'].capa_url).toBe('http://minio/dele.jpg');
    expect(porTitulo['Com foto'].cont_imagens).toBe(1);
    expect(porTitulo['Sem foto'].capa_url).toBeNull();
    expect(porTitulo['Sem foto'].cont_imagens).toBe(0);
  });

  it('a primeira evidência enviada aparece como capa mesmo com a listagem em cache', async () => {
    const id = await criarProblemaNoBanco({ usuarioId: autor });
    vi.mocked(enviarObjeto).mockResolvedValue('http://minio/primeira.jpg');

    const antes = await listarProblemas({});
    await enviarEvidenciaProblema({
      problemaId: id,
      usuarioId: autor,
      role: 'citizen',
      nomeArquivo: 'foto.jpg',
      mimetype: 'image/jpeg',
      conteudo: jpeg,
    });
    const depois = await listarProblemas({});

    expect(antes[0].capa_url).toBeNull();
    expect(depois[0].capa_url).toBe('http://minio/primeira.jpg');
    expect(depois[0].cont_imagens).toBe(1);
  });
});
