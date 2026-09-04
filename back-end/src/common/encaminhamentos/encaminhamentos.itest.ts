import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { dbPool } from '@config/database.js';
import { enviarEmail } from '@shared/email.js';
import {
  criarProblemaNoBanco,
  criarUsuario,
  encerrarBanco,
  limparBanco,
  primeiroOrgaoAtivo,
} from '../../tests/integracao/fixtures.js';
import {
  criarEncaminhamento,
  listarEncaminhamentos,
  reenviarEncaminhamento,
  registrarResposta,
} from './encaminhamentos.handler.js';

vi.mock('@shared/email.js', () => ({
  enviarEmail: vi.fn(),
}));

const mockEnviarEmail = vi.mocked(enviarEmail);

describe('encaminhamentos: envio, reenvio e resposta', () => {
  let autor: number;
  let problemaId: number;
  let orgaoId: number;

  beforeEach(async () => {
    await limparBanco();
    mockEnviarEmail.mockReset();
    mockEnviarEmail.mockResolvedValue({
      from: 'Mutira',
      to: 'caixa-dev@mutira.local',
      subject: 'x',
      text: 'y',
    });
    autor = await criarUsuario('Sara Encaminha');
    problemaId = await criarProblemaNoBanco({ usuarioId: autor });
    orgaoId = await primeiroOrgaoAtivo();
  });

  afterAll(encerrarBanco);

  it('não deixa registrar resposta de encaminhamento que nunca foi enviado', async () => {
    mockEnviarEmail.mockRejectedValueOnce(new Error('smtp fora do ar'));

    const encaminhamento = await criarEncaminhamento({
      problemaId,
      orgaoId,
      usuarioId: autor,
      role: 'citizen',
    });

    expect(encaminhamento.status).toBe('falhou');
    expect(encaminhamento.falha_motivo).toBe('smtp fora do ar');
    expect(encaminhamento.pode_registrar_resposta).toBe(false);
    expect(encaminhamento.pode_reenviar).toBe(true);

    await expect(
      registrarResposta({
        problemaId,
        encaminhamentoId: encaminhamento.id,
        resposta: 'O órgão respondeu por telefone.',
        usuarioId: autor,
        role: 'citizen',
      }),
    ).rejects.toThrow('Este encaminhamento ainda não foi enviado ao órgão.');
  });

  it('depois do reenvio bem-sucedido a resposta pode ser relatada', async () => {
    mockEnviarEmail.mockRejectedValueOnce(new Error('smtp fora do ar'));
    const criado = await criarEncaminhamento({
      problemaId,
      orgaoId,
      usuarioId: autor,
      role: 'citizen',
    });

    const reenviado = await reenviarEncaminhamento({
      problemaId,
      encaminhamentoId: criado.id,
      usuarioId: autor,
      role: 'citizen',
    });

    expect(reenviado.status).toBe('enviado');
    expect(reenviado.falha_motivo).toBeNull();
    expect(reenviado.pode_registrar_resposta).toBe(true);

    const respondido = await registrarResposta({
      problemaId,
      encaminhamentoId: criado.id,
      resposta: 'Serviço agendado para a próxima semana.',
      protocolo: 'OS-42',
      usuarioId: autor,
      role: 'citizen',
    });

    expect(respondido.status).toBe('respondido');
    expect(respondido.resposta_verificada).toBe(false);
  });

  it('o índice parcial impede dois encaminhamentos abertos para o mesmo órgão', async () => {
    const aberto = await criarEncaminhamento({
      problemaId,
      orgaoId,
      usuarioId: autor,
      role: 'citizen',
    });

    await expect(
      dbPool.query(
        `INSERT INTO problema_encaminhamentos
           (problema_id, orgao_id, usuario_id, referencia, assunto, mensagem, status)
         VALUES ($1, $2, $3, 'MUTIRA-DUP', 'assunto', 'corpo', 'pendente')`,
        [problemaId, orgaoId, autor],
      ),
    ).rejects.toMatchObject({ code: '23505' });

    await expect(
      criarEncaminhamento({ problemaId, orgaoId, usuarioId: autor, role: 'citizen' }),
    ).rejects.toThrow('Já existe um encaminhamento aberto para este órgão.');

    expect(aberto.status).toBe('enviado');
  });

  it('um encaminhamento que falhou não trava novos envios ao mesmo órgão', async () => {
    mockEnviarEmail.mockRejectedValueOnce(new Error('smtp fora do ar'));
    const comFalha = await criarEncaminhamento({
      problemaId,
      orgaoId,
      usuarioId: autor,
      role: 'citizen',
    });
    expect(comFalha.status).toBe('falhou');

    const novo = await criarEncaminhamento({
      problemaId,
      orgaoId,
      usuarioId: autor,
      role: 'citizen',
    });

    expect(novo.status).toBe('enviado');
    expect(novo.id).not.toBe(comFalha.id);

    const lista = await listarEncaminhamentos({ problemaId, usuarioId: autor, role: 'citizen' });
    expect(lista).toHaveLength(2);
  });

  it('encaminhamento respondido libera o órgão para um novo pedido', async () => {
    const criado = await criarEncaminhamento({
      problemaId,
      orgaoId,
      usuarioId: autor,
      role: 'citizen',
    });
    await registrarResposta({
      problemaId,
      encaminhamentoId: criado.id,
      resposta: 'Concluído.',
      usuarioId: autor,
      role: 'citizen',
    });

    const novo = await criarEncaminhamento({
      problemaId,
      orgaoId,
      usuarioId: autor,
      role: 'citizen',
    });

    expect(novo.status).toBe('enviado');
  });
});
