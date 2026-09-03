import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dbPool } from '@config/database.js';
import { enviarEmail } from '@shared/email.js';
import {
  criarEncaminhamento,
  listarEncaminhamentos,
  listarOrgaos,
  registrarResposta,
} from './encaminhamentos.handler.js';

vi.mock('@config/database.js', () => ({
  dbPool: { query: vi.fn() },
}));

vi.mock('@shared/transacao.js', async () => {
  const { dbPool: pool } = await import('@config/database.js');
  return { emTransacao: (fn: (executor: unknown) => unknown) => fn(pool) };
});

vi.mock('@shared/email.js', () => ({
  enviarEmail: vi.fn().mockResolvedValue({ to: 'caixa-dev@mutira.local' }),
}));

const mockQuery = dbPool.query as unknown as ReturnType<typeof vi.fn>;
const mockEnviarEmail = vi.mocked(enviarEmail);

const problemaDoAutor = { id: 42, usuario_id: 7, status: 'ativo', titulo: 'Alagamento', cont_apoios: 3, criado_em: '2026-09-01T12:00:00.000Z' };
const orgao = {
  id: 2,
  nome: '[EXEMPLO] Secretaria de Obras',
  email: 'obras@exemplo.invalid',
  esfera: 'municipal',
  tipo: 'secretaria',
  ativo: true,
};

function linhaEncaminhamento(extra: Record<string, unknown> = {}) {
  return {
    id: 11,
    problema_id: 42,
    orgao_id: 2,
    usuario_id: 7,
    referencia: 'MUTIRA-P000042',
    assunto: '[MUTIRA-P000042] Alagamento',
    mensagem: 'corpo',
    status: 'pendente',
    enviado_em: null,
    protocolo: null,
    resposta: null,
    respondido_em: null,
    criado_em: '2026-09-03T10:00:00.000Z',
    atualizado_em: '2026-09-03T10:00:00.000Z',
    orgao_nome: orgao.nome,
    orgao_esfera: orgao.esfera,
    orgao_tipo: orgao.tipo,
    autor_nome: 'Ana',
    ...extra,
  };
}

describe('encaminhamentos', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockEnviarEmail.mockClear();
    mockEnviarEmail.mockResolvedValue({
      from: 'Mutira',
      to: 'caixa-dev@mutira.local',
      subject: 'x',
      text: 'y',
    });
  });

  it('lista apenas os órgãos ativos sem expor o e-mail institucional', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [orgao] });

    const orgaos = await listarOrgaos();

    expect(orgaos[0]).toEqual({
      id: 2,
      nome: '[EXEMPLO] Secretaria de Obras',
      esfera: 'municipal',
      tipo: 'secretaria',
    });
    expect(mockQuery.mock.calls[0][0]).toContain('ativo = true');
  });

  it('cria o encaminhamento, emite ENCAMINHADO e leva o problema para encaminhado', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [problemaDoAutor] }) // exigirProblema
      .mockResolvedValueOnce({ rows: [orgao] }) // getOrgaoById
      .mockResolvedValueOnce({ rows: [] }) // encaminhamentoAberto
      .mockResolvedValueOnce({ rows: [{ nome: 'Ana' }] }) // nomeDoUsuario
      .mockResolvedValueOnce({ rows: [linhaEncaminhamento()] }) // inserirEncaminhamento
      .mockResolvedValueOnce({ rows: [{ id: 90 }] }) // evento ENCAMINHADO
      .mockResolvedValueOnce({ rows: [{ ...problemaDoAutor, status: 'encaminhado' }] }) // atualizarStatus
      .mockResolvedValueOnce({ rows: [{ id: 91 }] }) // evento STATUS_ALTERADO
      .mockResolvedValueOnce({ rows: [linhaEncaminhamento({ status: 'enviado' })] }); // marcarEnvio

    const encaminhamento = await criarEncaminhamento({
      problemaId: 42,
      orgaoId: 2,
      usuarioId: 7,
      role: 'citizen',
    });

    expect(encaminhamento.status).toBe('enviado');
    expect(encaminhamento.referencia).toBe('MUTIRA-P000042');
    expect(encaminhamento.orgao.nome).toBe('[EXEMPLO] Secretaria de Obras');
    expect(mockQuery.mock.calls[5][1]?.[1]).toBe('ENCAMINHADO');
    expect(mockQuery.mock.calls[7][1]?.[1]).toBe('STATUS_ALTERADO');
  });

  it('envia a petição gerada para o e-mail do órgão pelo transporte configurado', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [problemaDoAutor] })
      .mockResolvedValueOnce({ rows: [orgao] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ nome: 'Ana' }] })
      .mockResolvedValueOnce({ rows: [linhaEncaminhamento()] })
      .mockResolvedValueOnce({ rows: [{ id: 90 }] })
      .mockResolvedValueOnce({ rows: [{ ...problemaDoAutor, status: 'encaminhado' }] })
      .mockResolvedValueOnce({ rows: [{ id: 91 }] })
      .mockResolvedValueOnce({ rows: [linhaEncaminhamento({ status: 'enviado' })] });

    await criarEncaminhamento({ problemaId: 42, orgaoId: 2, usuarioId: 7, role: 'citizen' });

    const mensagem = mockEnviarEmail.mock.calls[0][0];
    expect(mensagem.para).toBe('obras@exemplo.invalid');
    expect(mensagem.assunto).toBe('[MUTIRA-P000042] Alagamento');
    expect(mensagem.corpo).toContain('MUTIRA-P000042');
  });

  it('marca o encaminhamento como falhou quando o e-mail não sai', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [problemaDoAutor] })
      .mockResolvedValueOnce({ rows: [orgao] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ nome: 'Ana' }] })
      .mockResolvedValueOnce({ rows: [linhaEncaminhamento()] })
      .mockResolvedValueOnce({ rows: [{ id: 90 }] })
      .mockResolvedValueOnce({ rows: [{ ...problemaDoAutor, status: 'encaminhado' }] })
      .mockResolvedValueOnce({ rows: [{ id: 91 }] })
      .mockResolvedValueOnce({ rows: [linhaEncaminhamento({ status: 'falhou' })] });
    mockEnviarEmail.mockRejectedValueOnce(new Error('smtp indisponível'));

    const encaminhamento = await criarEncaminhamento({
      problemaId: 42,
      orgaoId: 2,
      usuarioId: 7,
      role: 'citizen',
    });

    expect(encaminhamento.status).toBe('falhou');
  });

  it('recusa encaminhamento de quem não é autor nem moderação', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [problemaDoAutor] });

    await expect(
      criarEncaminhamento({ problemaId: 42, orgaoId: 2, usuarioId: 99, role: 'citizen' }),
    ).rejects.toThrow('Você não pode encaminhar este problema.');
    expect(mockEnviarEmail).not.toHaveBeenCalled();
  });

  it('recusa órgão inexistente ou inativo', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [problemaDoAutor] })
      .mockResolvedValueOnce({ rows: [{ ...orgao, ativo: false }] });

    await expect(
      criarEncaminhamento({ problemaId: 42, orgaoId: 2, usuarioId: 7, role: 'citizen' }),
    ).rejects.toThrow('Órgão responsável não encontrado.');
  });

  it('não abre um segundo encaminhamento para o mesmo órgão enquanto o anterior está aberto', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [problemaDoAutor] })
      .mockResolvedValueOnce({ rows: [orgao] })
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

    await expect(
      criarEncaminhamento({ problemaId: 42, orgaoId: 2, usuarioId: 7, role: 'citizen' }),
    ).rejects.toThrow('Já existe um encaminhamento aberto para este órgão.');
  });

  it('registra a resposta do órgão e emite RESPOSTA_RECEBIDA', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [linhaEncaminhamento({ status: 'enviado' })] })
      .mockResolvedValueOnce({
        rows: [
          linhaEncaminhamento({
            status: 'respondido',
            resposta: 'Serviço agendado.',
            protocolo: 'OS-123',
          }),
        ],
      })
      .mockResolvedValueOnce({ rows: [{ id: 92 }] });

    const encaminhamento = await registrarResposta({
      problemaId: 42,
      encaminhamentoId: 11,
      resposta: '  Serviço agendado.  ',
      protocolo: ' OS-123 ',
      usuarioId: 7,
      role: 'citizen',
    });

    expect(encaminhamento.status).toBe('respondido');
    expect(encaminhamento.pode_registrar_resposta).toBe(false);
    expect(mockQuery.mock.calls[1][1]).toEqual([11, 'Serviço agendado.', 'OS-123']);
    expect(mockQuery.mock.calls[2][1]?.[1]).toBe('RESPOSTA_RECEBIDA');
  });

  it('recusa resposta de quem não encaminhou nem modera', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [linhaEncaminhamento({ status: 'enviado' })] });

    await expect(
      registrarResposta({
        problemaId: 42,
        encaminhamentoId: 11,
        resposta: 'Serviço agendado.',
        usuarioId: 99,
        role: 'citizen',
      }),
    ).rejects.toThrow('Você não pode registrar a resposta deste encaminhamento.');
  });

  it('recusa resposta em encaminhamento de outro problema', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [linhaEncaminhamento({ problema_id: 7 })] });

    await expect(
      registrarResposta({
        problemaId: 42,
        encaminhamentoId: 11,
        resposta: 'Serviço agendado.',
        usuarioId: 7,
        role: 'citizen',
      }),
    ).rejects.toThrow('Encaminhamento não encontrado.');
  });

  it('não aceita duas respostas para o mesmo encaminhamento', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [linhaEncaminhamento({ status: 'respondido' })] });

    await expect(
      registrarResposta({
        problemaId: 42,
        encaminhamentoId: 11,
        resposta: 'Outra resposta.',
        usuarioId: 7,
        role: 'citizen',
      }),
    ).rejects.toThrow('Este encaminhamento já tem resposta registrada.');
  });

  it('marca pode_registrar_resposta apenas para quem pode agir', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [problemaDoAutor] })
      .mockResolvedValueOnce({ rows: [linhaEncaminhamento({ status: 'enviado' })] });

    const [doAutor] = await listarEncaminhamentos({ problemaId: 42, usuarioId: 7, role: 'citizen' });
    expect(doAutor.pode_registrar_resposta).toBe(true);

    mockQuery
      .mockResolvedValueOnce({ rows: [problemaDoAutor] })
      .mockResolvedValueOnce({ rows: [linhaEncaminhamento({ status: 'enviado' })] });

    const [deOutro] = await listarEncaminhamentos({
      problemaId: 42,
      usuarioId: 99,
      role: 'citizen',
    });
    expect(deOutro.pode_registrar_resposta).toBe(false);
  });
});
