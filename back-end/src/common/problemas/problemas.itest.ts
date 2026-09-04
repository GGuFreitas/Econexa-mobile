import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { dbPool } from '@config/database.js';
import { deslocarParaNorte } from '../../tests/integracao/banco.js';
import {
  criarProblemaNoBanco,
  criarUsuario,
  encerrarBanco,
  limparBanco,
  SAO_PAULO,
} from '../../tests/integracao/fixtures.js';
import {
  criarProblema,
  estatisticasProblemas,
  invalidarCacheDeProblemas,
  listarProblemas,
  RAIO_DEDUPE_METROS,
  tendenciasProblemasHandler,
} from './problemas.handler.js';
import { listarProblemasQuerySchema } from './problemas.schemas.js';
import { findNearbyProblema } from './problemas.sql.js';

async function marcarTags(problemaId: number, tags: string[]): Promise<number> {
  await dbPool.query('UPDATE problemas SET tags = $2 WHERE id = $1', [problemaId, tags]);
  return problemaId;
}

const A_20_METROS = deslocarParaNorte(SAO_PAULO.lat, 20);
const A_110_METROS = deslocarParaNorte(SAO_PAULO.lat, 110);
const A_2_KM = deslocarParaNorte(SAO_PAULO.lat, 2000);

describe('problemas: contrato espacial em metros', () => {
  let autor: number;

  beforeEach(async () => {
    await limparBanco();
    await invalidarCacheDeProblemas();
    autor = await criarUsuario('Ana Espacial');
  });

  afterAll(encerrarBanco);

  it('distancia_m sai em metros de verdade, não em graus', async () => {
    await criarProblemaNoBanco({ usuarioId: autor, lat: A_110_METROS, titulo: 'Vizinho' });

    const [proximo] = await listarProblemas({
      lat: SAO_PAULO.lat,
      lng: SAO_PAULO.lng,
      raio: 5000,
    });

    expect(proximo.distancia_m).toBeGreaterThan(105);
    expect(proximo.distancia_m).toBeLessThan(115);
  });

  it('o raio da listagem corta em metros: 110 m entra, 2 km fica de fora', async () => {
    await criarProblemaNoBanco({ usuarioId: autor, lat: A_110_METROS, titulo: 'Perto' });
    await criarProblemaNoBanco({ usuarioId: autor, lat: A_2_KM, titulo: 'Longe' });

    const dentro = await listarProblemas({ lat: SAO_PAULO.lat, lng: SAO_PAULO.lng, raio: 200 });
    const ampliado = await listarProblemas({ lat: SAO_PAULO.lat, lng: SAO_PAULO.lng, raio: 5000 });

    expect(dentro.map((p) => p.titulo)).toEqual(['Perto']);
    expect(ampliado.map((p) => p.titulo).sort()).toEqual(['Longe', 'Perto']);
  });

  it('o raio antigo em graus deixaria o país inteiro dentro do filtro', async () => {
    await criarProblemaNoBanco({ usuarioId: autor, lat: -8.0476, lng: -34.877, titulo: 'Recife' });

    const perto = await listarProblemas({ lat: SAO_PAULO.lat, lng: SAO_PAULO.lng, raio: 5000 });

    expect(perto).toHaveLength(0);
  });

  it('dedupe a ~20 m devolve o registro existente em vez de criar duplicata', async () => {
    const existente = await criarProblemaNoBanco({
      usuarioId: autor,
      lat: A_20_METROS,
      titulo: 'Buraco já registrado',
    });

    const resultado = await criarProblema({
      usuarioId: autor,
      titulo: 'Buraco na esquina',
      causaId: 1,
      lat: SAO_PAULO.lat,
      lng: SAO_PAULO.lng,
    });

    expect(resultado.criado).toBe(false);
    expect(resultado.problema.id).toBe(existente);

    const total = await dbPool.query('SELECT COUNT(*)::int AS total FROM problemas');
    expect(Number(total.rows[0].total)).toBe(1);
  });

  it('dedupe a ~2 km cria um problema novo', async () => {
    await criarProblemaNoBanco({ usuarioId: autor, lat: A_2_KM, titulo: 'Outro bairro' });

    const resultado = await criarProblema({
      usuarioId: autor,
      titulo: 'Buraco na esquina',
      causaId: 1,
      lat: SAO_PAULO.lat,
      lng: SAO_PAULO.lng,
    });

    expect(resultado.criado).toBe(true);

    const total = await dbPool.query('SELECT COUNT(*)::int AS total FROM problemas');
    expect(Number(total.rows[0].total)).toBe(2);
  });

  it('problema removido ou resolvido não bloqueia um registro novo no mesmo ponto', async () => {
    await criarProblemaNoBanco({
      usuarioId: autor,
      lat: SAO_PAULO.lat,
      status: 'removido',
      titulo: 'Removido',
    });
    await criarProblemaNoBanco({
      usuarioId: autor,
      lat: SAO_PAULO.lat,
      status: 'resolvido',
      titulo: 'Resolvido',
    });

    const resultado = await criarProblema({
      usuarioId: autor,
      titulo: 'Voltou a acontecer',
      causaId: 1,
      lat: SAO_PAULO.lat,
      lng: SAO_PAULO.lng,
    });

    expect(resultado.criado).toBe(true);
    expect(resultado.problema.titulo).toBe('Voltou a acontecer');
  });

  it('quando há mais de um candidato, o dedupe devolve o mais próximo', async () => {
    await criarProblemaNoBanco({
      usuarioId: autor,
      lat: deslocarParaNorte(SAO_PAULO.lat, 25),
      titulo: 'Mais longe',
    });
    const maisPerto = await criarProblemaNoBanco({
      usuarioId: autor,
      lat: deslocarParaNorte(SAO_PAULO.lat, 5),
      titulo: 'Mais perto',
    });

    const encontrado = await findNearbyProblema(
      SAO_PAULO.lat,
      SAO_PAULO.lng,
      RAIO_DEDUPE_METROS,
      1,
      'problema',
    );

    expect(encontrado?.id).toBe(maisPerto);
    expect(Number(encontrado?.distancia_m)).toBeLessThan(10);
  });

  it('causa ou tipo diferente não é tratado como duplicata', async () => {
    await criarProblemaNoBanco({
      usuarioId: autor,
      lat: SAO_PAULO.lat,
      causaId: 2,
      titulo: 'Outra causa',
    });

    const resultado = await criarProblema({
      usuarioId: autor,
      titulo: 'Poluição no córrego',
      causaId: 3,
      lat: SAO_PAULO.lat,
      lng: SAO_PAULO.lng,
    });

    expect(resultado.criado).toBe(true);
  });

  it('sem status na consulta a listagem esconde o removido e mostra o encaminhado', async () => {
    await criarProblemaNoBanco({ usuarioId: autor, status: 'removido', titulo: 'Removido' });
    await criarProblemaNoBanco({
      usuarioId: autor,
      lat: A_110_METROS,
      status: 'encaminhado',
      titulo: 'Encaminhado',
    });

    const lista = await listarProblemas({});

    expect(lista.map((p) => p.titulo)).toEqual(['Encaminhado']);
  });

  it('as estatísticas param no raio pedido em vez de contar o país inteiro', async () => {
    await criarProblemaNoBanco({ usuarioId: autor, lat: A_110_METROS, titulo: 'Perto' });
    await criarProblemaNoBanco({ usuarioId: autor, lat: A_2_KM, titulo: 'Longe' });
    await criarProblemaNoBanco({ usuarioId: autor, lat: -8.0476, lng: -34.877, titulo: 'Recife' });

    const noRaio = await estatisticasProblemas({
      lat: SAO_PAULO.lat,
      lng: SAO_PAULO.lng,
      raio: 200,
    });
    const semPonto = await estatisticasProblemas({});

    expect(noRaio.total).toBe(1);
    expect(semPonto.total).toBe(3);
  });

  it('a quebra por causa também respeita o raio', async () => {
    await criarProblemaNoBanco({ usuarioId: autor, lat: A_110_METROS, causaId: 1 });
    await criarProblemaNoBanco({ usuarioId: autor, lat: A_2_KM, causaId: 2 });

    const { porCausa, porTipo, total } = await estatisticasProblemas({
      lat: SAO_PAULO.lat,
      lng: SAO_PAULO.lng,
      raio: 500,
    });

    expect(porCausa).toEqual([{ causa_id: 1, total: 1 }]);
    expect(porTipo).toEqual([{ tipo: 'problema', total: 1 }]);
    expect(total).toBe(1);
    expect(porCausa.reduce((soma, causa) => soma + causa.total, 0)).toBe(total);
  });

  it('as tendências param no raio pedido', async () => {
    await criarProblemaNoBanco({ usuarioId: autor, lat: A_110_METROS, titulo: 'Perto' });
    await criarProblemaNoBanco({ usuarioId: autor, lat: A_2_KM, titulo: 'Longe' });

    const proximas = await tendenciasProblemasHandler({
      lat: SAO_PAULO.lat,
      lng: SAO_PAULO.lng,
      raio: 500,
    });
    const todas = await tendenciasProblemasHandler({});

    expect(proximas.map((problema) => problema.titulo)).toEqual(['Perto']);
    expect(todas).toHaveLength(2);
  });

  it('filtrar por várias tags casa tag a tag, não pela string junta', async () => {
    await marcarTags(
      await criarProblemaNoBanco({ usuarioId: autor, titulo: 'Com enchente' }),
      ['enchente'],
    );
    await marcarTags(
      await criarProblemaNoBanco({ usuarioId: autor, lat: A_110_METROS, titulo: 'Com buraco' }),
      ['buraco'],
    );
    await marcarTags(
      await criarProblemaNoBanco({ usuarioId: autor, lat: A_2_KM, titulo: 'Sem nenhuma' }),
      ['poda'],
    );

    const filtradas = await listarProblemas({ tags: ['enchente', 'buraco'] });
    const literal = await listarProblemas({ tags: ['enchente,buraco'] });

    expect(filtradas.map((problema) => problema.titulo).sort()).toEqual([
      'Com buraco',
      'Com enchente',
    ]);
    expect(literal).toHaveLength(0);
  });

  it('o schema aceita uma tag só, a lista separada por vírgula e o array repetido', () => {
    expect(listarProblemasQuerySchema.parse({ tags: 'enchente' }).tags).toEqual(['enchente']);
    expect(listarProblemasQuerySchema.parse({ tags: 'enchente, buraco' }).tags).toEqual([
      'enchente',
      'buraco',
    ]);
    expect(listarProblemasQuerySchema.parse({ tags: ['enchente', 'buraco'] }).tags).toEqual([
      'enchente',
      'buraco',
    ]);
  });
});
