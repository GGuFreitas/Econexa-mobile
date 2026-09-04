import { dbPool } from '@config/database.js';
import type { Executor } from '@shared/transacao.js';
import type {
  EncaminhamentoRow,
  InserirEncaminhamentoInput,
  Orgao,
} from './encaminhamentos.types.js';

const SELECT_ENCAMINHAMENTO = `
  SELECT e.*, o.nome AS orgao_nome, o.esfera AS orgao_esfera, o.tipo AS orgao_tipo,
         u.nome AS autor_nome
  FROM problema_encaminhamentos e
  INNER JOIN orgaos o ON o.id = e.orgao_id
  INNER JOIN users u ON u.id = e.usuario_id
`;

export async function listarOrgaos(): Promise<Orgao[]> {
  const result = await dbPool.query(
    'SELECT id, nome, email, esfera, tipo, ativo FROM orgaos WHERE ativo = true ORDER BY esfera, nome',
  );
  return result.rows;
}

export async function nomeDoUsuario(id: number): Promise<string> {
  const result = await dbPool.query('SELECT nome FROM users WHERE id = $1', [id]);
  return result.rows[0]?.nome ?? 'Usuário da plataforma';
}

export async function getOrgaoById(id: number): Promise<Orgao | null> {
  const result = await dbPool.query(
    'SELECT id, nome, email, esfera, tipo, ativo FROM orgaos WHERE id = $1',
    [id],
  );
  return result.rows[0] ?? null;
}

export async function encaminhamentoAberto(
  problemaId: number,
  orgaoId: number,
): Promise<boolean> {
  const result = await dbPool.query(
    `SELECT 1 FROM problema_encaminhamentos
     WHERE problema_id = $1 AND orgao_id = $2 AND status <> 'respondido'`,
    [problemaId, orgaoId],
  );
  return result.rows.length > 0;
}

export async function inserirEncaminhamento(
  input: InserirEncaminhamentoInput,
  executor: Executor = dbPool,
): Promise<EncaminhamentoRow> {
  const result = await executor.query(
    `WITH novo AS (
       INSERT INTO problema_encaminhamentos
         (problema_id, orgao_id, usuario_id, referencia, assunto, mensagem)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *
     )
     SELECT novo.*, o.nome AS orgao_nome, o.esfera AS orgao_esfera, o.tipo AS orgao_tipo,
            u.nome AS autor_nome
     FROM novo
     INNER JOIN orgaos o ON o.id = novo.orgao_id
     INNER JOIN users u ON u.id = novo.usuario_id`,
    [
      input.problemaId,
      input.orgaoId,
      input.usuarioId,
      input.referencia,
      input.assunto,
      input.mensagem,
    ],
  );
  return result.rows[0];
}

export async function listarEncaminhamentos(problemaId: number): Promise<EncaminhamentoRow[]> {
  const result = await dbPool.query(
    `${SELECT_ENCAMINHAMENTO} WHERE e.problema_id = $1 ORDER BY e.criado_em DESC, e.id DESC`,
    [problemaId],
  );
  return result.rows;
}

export async function getEncaminhamentoById(id: number): Promise<EncaminhamentoRow | null> {
  const result = await dbPool.query(`${SELECT_ENCAMINHAMENTO} WHERE e.id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function marcarEnvio(
  id: number,
  enviado: boolean,
): Promise<EncaminhamentoRow> {
  const result = await dbPool.query(
    `WITH atualizado AS (
       UPDATE problema_encaminhamentos
       SET status = $2::text,
           enviado_em = CASE WHEN $2::text = 'enviado' THEN now() ELSE enviado_em END,
           atualizado_em = now()
       WHERE id = $1
       RETURNING *
     )
     SELECT atualizado.*, o.nome AS orgao_nome, o.esfera AS orgao_esfera, o.tipo AS orgao_tipo,
            u.nome AS autor_nome
     FROM atualizado
     INNER JOIN orgaos o ON o.id = atualizado.orgao_id
     INNER JOIN users u ON u.id = atualizado.usuario_id`,
    [id, enviado ? 'enviado' : 'falhou'],
  );
  return result.rows[0];
}

export async function registrarResposta(
  id: number,
  resposta: string,
  protocolo: string | null,
  executor: Executor = dbPool,
): Promise<EncaminhamentoRow> {
  const result = await executor.query(
    `WITH atualizado AS (
       UPDATE problema_encaminhamentos
       SET resposta = $2, protocolo = $3, status = 'respondido',
           respondido_em = now(), atualizado_em = now()
       WHERE id = $1
       RETURNING *
     )
     SELECT atualizado.*, o.nome AS orgao_nome, o.esfera AS orgao_esfera, o.tipo AS orgao_tipo,
            u.nome AS autor_nome
     FROM atualizado
     INNER JOIN orgaos o ON o.id = atualizado.orgao_id
     INNER JOIN users u ON u.id = atualizado.usuario_id`,
    [id, resposta, protocolo],
  );
  return result.rows[0];
}
