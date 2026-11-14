import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { dbPool } from '@config/database.js';
import {
  criarProblemaNoBanco,
  criarUsuario,
  encerrarBanco,
  limparBanco,
} from '../../tests/integracao/fixtures.js';
import { criarServidor, tokenDe } from '../../tests/integracao/servidor.js';

let app: FastifyInstance;

async function tornarAdmin(usuarioId: number): Promise<void> {
  await dbPool.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [usuarioId]);
}

function comToken(usuarioId: number) {
  return { authorization: `Bearer ${tokenDe(usuarioId)}` };
}

async function denunciar(
  problemaId: number,
  usuarioId: number,
  motivo: string,
  criadoEm: string,
): Promise<void> {
  await dbPool.query(
    'INSERT INTO problema_denuncias (problema_id, usuario_id, motivo, criado_em) VALUES ($1, $2, $3, $4)',
    [problemaId, usuarioId, motivo, criadoEm],
  );
}

describe('moderação', () => {
  let admin: number;
  let autor: number;
  let problema: number;

  beforeAll(async () => {
    app = await criarServidor();
  });

  beforeEach(async () => {
    await limparBanco();
    admin = await criarUsuario('Mara Moderadora');
    await tornarAdmin(admin);
    autor = await criarUsuario('Ivo Autor');
    problema = await criarProblemaNoBanco({ usuarioId: autor, titulo: 'Propaganda disfarçada' });
    await denunciar(problema, await criarUsuario('Lia Vizinha'), 'spam', '2026-11-01T10:00:00Z');
    await denunciar(
      problema,
      await criarUsuario('Teo Vizinho'),
      'conteudo_inadequado',
      '2026-11-02T10:00:00Z',
    );
  });

  afterAll(async () => {
    await app.close();
    await encerrarBanco();
  });

  it('a fila mostra o problema denunciado com contagem, motivos e autor', async () => {
    const resposta = await app.inject({
      method: 'GET',
      url: '/api/moderacao/denuncias',
      headers: comToken(admin),
    });

    expect(resposta.statusCode).toBe(200);
    expect(resposta.json()).toEqual([
      expect.objectContaining({
        problema_id: problema,
        titulo: 'Propaganda disfarçada',
        autor_id: autor,
        autor_bloqueado: false,
        total_denuncias: 2,
        motivos: ['conteudo_inadequado', 'spam'],
      }),
    ]);
  });

  it('quem não é da moderação recebe 403 em todas as rotas', async () => {
    const cidadao = await criarUsuario('Rui Curioso');
    const pedidos = [
      { method: 'GET' as const, url: '/api/moderacao/denuncias' },
      { method: 'DELETE' as const, url: `/api/moderacao/denuncias/${problema}` },
      { method: 'POST' as const, url: `/api/moderacao/usuarios/${autor}/bloqueio`, payload: { motivo: 'spam' } },
      { method: 'DELETE' as const, url: `/api/moderacao/usuarios/${autor}/bloqueio` },
    ];

    for (const pedido of pedidos) {
      const resposta = await app.inject({ ...pedido, headers: comToken(cidadao) });
      expect(resposta.statusCode).toBe(403);
    }
  });

  it('descartar as denúncias tira o problema da fila', async () => {
    const descarte = await app.inject({
      method: 'DELETE',
      url: `/api/moderacao/denuncias/${problema}`,
      headers: comToken(admin),
    });
    const fila = await app.inject({
      method: 'GET',
      url: '/api/moderacao/denuncias',
      headers: comToken(admin),
    });

    expect(descarte.statusCode).toBe(204);
    expect(fila.json()).toEqual([]);
  });

  it('problema removido sai da fila', async () => {
    await dbPool.query(`UPDATE problemas SET status = 'removido' WHERE id = $1`, [problema]);

    const fila = await app.inject({
      method: 'GET',
      url: '/api/moderacao/denuncias',
      headers: comToken(admin),
    });

    expect(fila.json()).toEqual([]);
  });

  it('bloquear derruba o acesso do autor e desbloquear devolve', async () => {
    const bloqueio = await app.inject({
      method: 'POST',
      url: `/api/moderacao/usuarios/${autor}/bloqueio`,
      headers: comToken(admin),
      payload: { motivo: 'Publicidade repetida' },
    });
    expect(bloqueio.statusCode).toBe(204);

    const linha = await dbPool.query(
      'SELECT bloqueado_em, bloqueado_por, bloqueio_motivo, sessao_versao FROM users WHERE id = $1',
      [autor],
    );
    expect(linha.rows[0]).toMatchObject({
      bloqueado_por: admin,
      bloqueio_motivo: 'Publicidade repetida',
      sessao_versao: 1,
    });
    expect(linha.rows[0].bloqueado_em).not.toBeNull();

    const comTokenNovo = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${tokenDe(autor, 1)}` },
    });
    expect(comTokenNovo.statusCode).toBe(403);
    expect(comTokenNovo.json().notification.code).toBe('CONTA_BLOQUEADA');

    const desbloqueio = await app.inject({
      method: 'DELETE',
      url: `/api/moderacao/usuarios/${autor}/bloqueio`,
      headers: comToken(admin),
    });
    expect(desbloqueio.statusCode).toBe(204);

    const deNovo = await app.inject({
      method: 'DELETE',
      url: `/api/moderacao/usuarios/${autor}/bloqueio`,
      headers: comToken(admin),
    });
    expect(deNovo.statusCode).toBe(404);
  });

  it('não bloqueia a si mesmo nem outra conta da moderação', async () => {
    const outroAdmin = await criarUsuario('Noa Moderadora');
    await tornarAdmin(outroAdmin);

    const aSiMesmo = await app.inject({
      method: 'POST',
      url: `/api/moderacao/usuarios/${admin}/bloqueio`,
      headers: comToken(admin),
      payload: { motivo: 'teste' },
    });
    const outro = await app.inject({
      method: 'POST',
      url: `/api/moderacao/usuarios/${outroAdmin}/bloqueio`,
      headers: comToken(admin),
      payload: { motivo: 'teste' },
    });

    expect(aSiMesmo.statusCode).toBe(400);
    expect(outro.statusCode).toBe(400);
  });
});
