import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  contadoresDoProblema,
  contarApoios,
  criarProblemaNoBanco,
  criarUsuario,
  encerrarBanco,
  limparBanco,
  tiposDeEvento,
} from '../../tests/integracao/fixtures.js';
import { apoiarProblema, desapoiarProblema } from './apoios.handler.js';

describe('apoios: atomicidade e contadores', () => {
  let autor: number;
  let problemaId: number;

  beforeEach(async () => {
    await limparBanco();
    autor = await criarUsuario('Carla Apoio');
    problemaId = await criarProblemaNoBanco({ usuarioId: autor });
  });

  afterAll(encerrarBanco);

  it('apoios concorrentes do mesmo usuário resultam em uma linha e contador 1', async () => {
    const apoiador = await criarUsuario('Dani Concorrente', 3);

    const resultados = await Promise.all(
      Array.from({ length: 8 }, () => apoiarProblema(problemaId, apoiador)),
    );

    expect(resultados.every((resultado) => resultado.apoiado)).toBe(true);
    expect(await contarApoios(problemaId)).toBe(1);
    expect(await contadoresDoProblema(problemaId)).toEqual({
      cont_apoios: 1,
      cont_apoios_ponderados: 3,
    });
    expect((await tiposDeEvento(problemaId)).filter((tipo) => tipo === 'APOIO_CRIADO')).toHaveLength(
      1,
    );
  });

  it('cont_apoios bate com COUNT(*) depois de apoiar e desapoiar em sequência', async () => {
    const pessoas = await Promise.all([
      criarUsuario('Eva', 1),
      criarUsuario('Fábio', 2),
      criarUsuario('Gina', 5),
    ]);

    for (const pessoa of pessoas) {
      await apoiarProblema(problemaId, pessoa);
    }
    await desapoiarProblema(problemaId, pessoas[1]);
    await apoiarProblema(problemaId, pessoas[1]);
    await desapoiarProblema(problemaId, pessoas[2]);

    const contadores = await contadoresDoProblema(problemaId);

    expect(contadores.cont_apoios).toBe(await contarApoios(problemaId));
    expect(contadores.cont_apoios).toBe(2);
    expect(contadores.cont_apoios_ponderados).toBe(3);
  });

  it('desapoiar quem nunca apoiou não derruba o contador para negativo', async () => {
    const apoiador = await criarUsuario('Hugo', 1);
    const estranho = await criarUsuario('Ivo', 1);

    await apoiarProblema(problemaId, apoiador);
    await desapoiarProblema(problemaId, estranho);
    await desapoiarProblema(problemaId, estranho);

    expect(await contadoresDoProblema(problemaId)).toEqual({
      cont_apoios: 1,
      cont_apoios_ponderados: 1,
    });
  });

  it('emite APOIO_CRIADO e APOIO_REMOVIDO na mesma transação do contador', async () => {
    const apoiador = await criarUsuario('Joana', 2);

    await apoiarProblema(problemaId, apoiador);
    await desapoiarProblema(problemaId, apoiador);

    expect(await tiposDeEvento(problemaId)).toEqual(['APOIO_CRIADO', 'APOIO_REMOVIDO']);
    expect(await contadoresDoProblema(problemaId)).toEqual({
      cont_apoios: 0,
      cont_apoios_ponderados: 0,
    });
  });

  it('apoios concorrentes de pessoas diferentes somam o peso de cada uma', async () => {
    const pessoas = await Promise.all([
      criarUsuario('Kelly', 1),
      criarUsuario('Léo', 2),
      criarUsuario('Malu', 4),
    ]);

    await Promise.all(pessoas.map((pessoa) => apoiarProblema(problemaId, pessoa)));

    expect(await contadoresDoProblema(problemaId)).toEqual({
      cont_apoios: 3,
      cont_apoios_ponderados: 7,
    });
    expect(await contarApoios(problemaId)).toBe(3);
  });
});
