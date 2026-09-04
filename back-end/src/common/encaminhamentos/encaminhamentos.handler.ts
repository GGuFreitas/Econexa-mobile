import { AppError } from '@shared/errors.js';
import { emTransacao } from '@shared/transacao.js';
import { enviarEmail } from '@shared/email.js';
import { env } from '@config/env.js';
import { can, type Role } from '@common/abilities.js';
import { aplicarStatusProblema, exigirProblema } from '@common/problemas/problemas.handler.js';
import { registrarEvento } from '@common/problemaEventos/problemaEventos.handler.js';
import { gerarPeticao } from '@features/peticoes/peticoes.js';
import * as sql from './encaminhamentos.sql.js';
import type {
  CriarEncaminhamentoInput,
  Encaminhamento,
  EncaminhamentoRow,
  ListarEncaminhamentosInput,
  OrgaoPublico,
  RegistrarRespostaInput,
} from './encaminhamentos.types.js';

function podeResponder(row: EncaminhamentoRow, usuarioId: number, role: string): boolean {
  return row.usuario_id === usuarioId || can(role as Role, 'problemas:moderate');
}

function apresentar(row: EncaminhamentoRow, usuarioId: number, role: string): Encaminhamento {
  return {
    id: row.id,
    problema_id: row.problema_id,
    referencia: row.referencia,
    assunto: row.assunto,
    mensagem: row.mensagem,
    status: row.status,
    enviado_em: row.enviado_em,
    protocolo: row.protocolo,
    resposta: row.resposta,
    respondido_em: row.respondido_em,
    criado_em: row.criado_em,
    orgao: {
      id: row.orgao_id,
      nome: row.orgao_nome,
      esfera: row.orgao_esfera,
      tipo: row.orgao_tipo,
    },
    autor: { id: row.usuario_id, nome: row.autor_nome },
    pode_registrar_resposta:
      row.status !== 'respondido' && podeResponder(row, usuarioId, role),
  };
}

export async function listarOrgaos(): Promise<OrgaoPublico[]> {
  const orgaos = await sql.listarOrgaos();
  return orgaos.map((orgao) => ({
    id: orgao.id,
    nome: orgao.nome,
    esfera: orgao.esfera,
    tipo: orgao.tipo,
  }));
}

export async function listarEncaminhamentos(
  input: ListarEncaminhamentosInput,
): Promise<Encaminhamento[]> {
  await exigirProblema(input.problemaId);
  const rows = await sql.listarEncaminhamentos(input.problemaId);
  return rows.map((row) => apresentar(row, input.usuarioId, input.role));
}

export async function criarEncaminhamento(
  input: CriarEncaminhamentoInput,
): Promise<Encaminhamento> {
  const problema = await exigirProblema(input.problemaId);

  if (problema.usuario_id !== input.usuarioId && !can(input.role as Role, 'problemas:moderate')) {
    throw new AppError('Você não pode encaminhar este problema.', 403);
  }
  if (problema.status === 'removido') {
    throw new AppError('Este problema foi removido e não pode ser encaminhado.', 400);
  }

  const orgao = await sql.getOrgaoById(input.orgaoId);
  if (!orgao || !orgao.ativo) {
    throw new AppError('Órgão responsável não encontrado.', 404);
  }

  if (await sql.encaminhamentoAberto(input.problemaId, input.orgaoId)) {
    throw new AppError('Já existe um encaminhamento aberto para este órgão.', 400);
  }

  const autor = await sql.nomeDoUsuario(input.usuarioId);
  const peticao = gerarPeticao({
    problema,
    orgao: { nome: orgao.nome, esfera: orgao.esfera },
    autor,
    linkPublico: `${env.APP_PUBLIC_URL.replace(/\/$/, '')}/problemas/${problema.id}`,
    mensagem: input.mensagem,
  });

  const criado = await emTransacao(async (executor) => {
    const row = await sql.inserirEncaminhamento(
      {
        problemaId: input.problemaId,
        orgaoId: input.orgaoId,
        usuarioId: input.usuarioId,
        referencia: peticao.referencia,
        assunto: peticao.assunto,
        mensagem: peticao.corpo,
      },
      executor,
    );

    await registrarEvento(
      {
        problemaId: input.problemaId,
        tipo: 'ENCAMINHADO',
        usuarioId: input.usuarioId,
        dados: {
          encaminhamento_id: row.id,
          orgao_nome: orgao.nome,
          referencia: peticao.referencia,
        },
      },
      executor,
    );

    if (problema.status !== 'encaminhado' && problema.status !== 'resolvido') {
      await aplicarStatusProblema(problema, 'encaminhado', input.usuarioId, executor);
    }

    return row;
  });

  let enviado = true;
  try {
    await enviarEmail({ para: orgao.email, assunto: peticao.assunto, corpo: peticao.corpo });
  } catch {
    enviado = false;
  }

  const atualizado = await sql.marcarEnvio(criado.id, enviado);
  return apresentar(atualizado, input.usuarioId, input.role);
}

export async function registrarResposta(
  input: RegistrarRespostaInput,
): Promise<Encaminhamento> {
  const encaminhamento = await sql.getEncaminhamentoById(input.encaminhamentoId);
  if (!encaminhamento || encaminhamento.problema_id !== input.problemaId) {
    throw new AppError('Encaminhamento não encontrado.', 404);
  }
  if (!podeResponder(encaminhamento, input.usuarioId, input.role)) {
    throw new AppError('Você não pode registrar a resposta deste encaminhamento.', 403);
  }
  if (encaminhamento.status === 'respondido') {
    throw new AppError('Este encaminhamento já tem resposta registrada.', 400);
  }

  const atualizado = await emTransacao(async (executor) => {
    const row = await sql.registrarResposta(
      input.encaminhamentoId,
      input.resposta.trim(),
      input.protocolo?.trim() || null,
      executor,
    );

    await registrarEvento(
      {
        problemaId: input.problemaId,
        tipo: 'RESPOSTA_RECEBIDA',
        usuarioId: input.usuarioId,
        dados: {
          encaminhamento_id: row.id,
          orgao_nome: row.orgao_nome,
          protocolo: row.protocolo,
        },
      },
      executor,
    );

    return row;
  });

  return apresentar(atualizado, input.usuarioId, input.role);
}
