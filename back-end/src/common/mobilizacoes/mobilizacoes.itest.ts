import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  criarProblemaNoBanco,
  criarUsuario,
  encerrarBanco,
  limparBanco,
} from '../../tests/integracao/fixtures.js';
import {
  atualizarMobilizacao,
  atualizarStatusMobilizacao,
  criarMobilizacao,
  obterMobilizacao,
  registrarResultadoMobilizacao,
} from './mobilizacoes.handler.js';

const RESULTADO = { descricao: 'Recolhemos dez sacos de entulho.' };

async function mobilizacaoAgendada(criadorId: number, problemaId: number): Promise<number> {
  const mobilizacao = await criarMobilizacao({
    usuarioId: criadorId,
    problemaId,
    titulo: 'Mutirão da praça',
    dataInicio: '2026-10-01T09:00:00Z',
  });
  return mobilizacao.id;
}

describe('mobilizações: só o criador ou a moderação gerencia', () => {
  let criador: number;
  let estranho: number;
  let problemaId: number;
  let mobilizacaoId: number;

  beforeEach(async () => {
    await limparBanco();
    criador = await criarUsuario('Iris Criadora');
    estranho = await criarUsuario('Jonas Estranho');
    problemaId = await criarProblemaNoBanco({ usuarioId: criador });
    mobilizacaoId = await mobilizacaoAgendada(criador, problemaId);
  });

  afterAll(encerrarBanco);

  it('quem não criou recebe 403 ao reescrever a mobilização', async () => {
    await expect(
      atualizarMobilizacao(mobilizacaoId, { titulo: 'Sequestrada' }, estranho, 'citizen'),
    ).rejects.toMatchObject({ statusCode: 403 });

    const intacta = await obterMobilizacao(mobilizacaoId, criador, 'citizen');
    expect(intacta.titulo).toBe('Mutirão da praça');
  });

  it('quem não criou recebe 403 ao cancelar a mobilização', async () => {
    await expect(
      atualizarStatusMobilizacao(mobilizacaoId, 'cancelada', estranho, 'citizen'),
    ).rejects.toMatchObject({ statusCode: 403 });

    const intacta = await obterMobilizacao(mobilizacaoId, criador, 'citizen');
    expect(intacta.status).toBe('agendada');
  });

  it('quem não criou recebe 403 ao registrar resultado', async () => {
    await atualizarStatusMobilizacao(mobilizacaoId, 'em_andamento', criador, 'citizen');

    await expect(
      registrarResultadoMobilizacao(mobilizacaoId, RESULTADO, estranho, 'citizen'),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('o especialista não herda poder sobre mobilização alheia', async () => {
    await expect(
      atualizarStatusMobilizacao(mobilizacaoId, 'cancelada', estranho, 'specialist'),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('a moderação gerencia mobilização alheia', async () => {
    const cancelada = await atualizarStatusMobilizacao(
      mobilizacaoId,
      'cancelada',
      estranho,
      'admin',
    );

    expect(cancelada.status).toBe('cancelada');
    expect(cancelada.pode_gerenciar).toBe(true);
  });

  it('pode_gerenciar sai no payload e reflete quem está pedindo', async () => {
    const paraCriador = await obterMobilizacao(mobilizacaoId, criador, 'citizen');
    const paraEstranho = await obterMobilizacao(mobilizacaoId, estranho, 'citizen');
    const paraAnonimo = await obterMobilizacao(mobilizacaoId);

    expect(paraCriador.pode_gerenciar).toBe(true);
    expect(paraEstranho.pode_gerenciar).toBe(false);
    expect(paraAnonimo.pode_gerenciar).toBe(false);
  });

  it('registrar resultado numa mobilização agendada é recusado como transição inválida', async () => {
    await expect(
      registrarResultadoMobilizacao(mobilizacaoId, RESULTADO, criador, 'citizen'),
    ).rejects.toMatchObject({ statusCode: 400 });

    const intacta = await obterMobilizacao(mobilizacaoId, criador, 'citizen');
    expect(intacta.status).toBe('agendada');
    expect(intacta.resultado_descricao).toBeNull();
  });

  it('registrar resultado numa mobilização cancelada é recusado', async () => {
    await atualizarStatusMobilizacao(mobilizacaoId, 'cancelada', criador, 'citizen');

    await expect(
      registrarResultadoMobilizacao(mobilizacaoId, RESULTADO, criador, 'citizen'),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('o criador registra resultado a partir de em_andamento', async () => {
    await atualizarStatusMobilizacao(mobilizacaoId, 'em_andamento', criador, 'citizen');

    const concluida = await registrarResultadoMobilizacao(
      mobilizacaoId,
      RESULTADO,
      criador,
      'citizen',
    );

    expect(concluida.status).toBe('realizada');
    expect(concluida.resultado_descricao).toBe(RESULTADO.descricao);
  });
});
