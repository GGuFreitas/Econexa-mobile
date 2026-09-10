import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  criarProblemaNoBanco,
  criarUsuario,
  encerrarBanco,
  limparBanco,
} from '../../tests/integracao/fixtures.js';
import { alterarStatusProblema, obterProblema } from './problemas.handler.js';

describe('problemas: quem pode mexer no status', () => {
  let autor: number;
  let estranho: number;
  let problemaId: number;

  beforeEach(async () => {
    await limparBanco();
    autor = await criarUsuario('Kelly Autora');
    estranho = await criarUsuario('Leo Estranho');
    problemaId = await criarProblemaNoBanco({ usuarioId: autor });
  });

  afterAll(encerrarBanco);

  it('quem não é autor recebe 403 ao alterar o status', async () => {
    await expect(
      alterarStatusProblema({
        problemaId,
        status: 'resolvido',
        usuarioId: estranho,
        role: 'citizen',
      }),
    ).rejects.toMatchObject({ statusCode: 403 });

    const intacto = await obterProblema(problemaId, autor, 'citizen');
    expect(intacto.status).toBe('ativo');
  });

  it('o especialista deixou de moderar problema alheio', async () => {
    await expect(
      alterarStatusProblema({
        problemaId,
        status: 'em_analise',
        usuarioId: estranho,
        role: 'specialist',
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('o especialista também não remove o próprio problema', async () => {
    await expect(
      alterarStatusProblema({
        problemaId,
        status: 'removido',
        usuarioId: autor,
        role: 'specialist',
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('o autor continua movendo o próprio problema', async () => {
    const atualizado = await alterarStatusProblema({
      problemaId,
      status: 'em_analise',
      usuarioId: autor,
      role: 'citizen',
    });

    expect(atualizado.status).toBe('em_analise');
  });

  it('a moderação remove problema alheio e o especialista não vê a transição', async () => {
    const paraEspecialista = await obterProblema(problemaId, estranho, 'specialist');
    expect(paraEspecialista.transicoes_permitidas).toEqual([]);

    const paraAdmin = await obterProblema(problemaId, estranho, 'admin');
    expect(paraAdmin.transicoes_permitidas).toContain('removido');

    const removido = await alterarStatusProblema({
      problemaId,
      status: 'removido',
      usuarioId: estranho,
      role: 'admin',
    });
    expect(removido.status).toBe('removido');
  });
});
