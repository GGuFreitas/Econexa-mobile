import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dbPool } from '@config/database.js';
import { excluirConta } from './exclusao.js';

vi.mock('@config/database.js', () => ({
  dbPool: { query: vi.fn() },
}));

vi.mock('@shared/transacao.js', async () => {
  const { dbPool: pool } = await import('@config/database.js');
  return { emTransacao: (fn: (executor: unknown) => unknown) => fn(pool) };
});

const mockQuery = dbPool.query as unknown as ReturnType<typeof vi.fn>;

function contaTravada(linha: Record<string, unknown> | null) {
  mockQuery.mockImplementation(async (sql: string) =>
    sql.includes('FOR UPDATE') ? { rows: linha ? [linha] : [] } : { rows: [] },
  );
}

function consultasCom(trecho: string): unknown[][] {
  return mockQuery.mock.calls.filter(([sql]) => String(sql).includes(trecho));
}

beforeEach(() => {
  mockQuery.mockReset();
});

describe('excluirConta', () => {
  it('conta só-Google, sem senha, é anonimizada sem pedir senha', async () => {
    contaTravada({ id: 7, senha: null, excluido_em: null });

    await excluirConta(7);

    expect(consultasCom('UPDATE users')).toHaveLength(1);
    expect(consultasCom('DELETE FROM usuario_oauth_contas')).toHaveLength(1);
    expect(consultasCom('DELETE FROM refresh_tokens')).toHaveLength(1);
  });

  it('conta já excluída ou inexistente responde 404 sem escrever nada', async () => {
    contaTravada({ id: 7, senha: null, excluido_em: new Date() });
    await expect(excluirConta(7)).rejects.toMatchObject({ statusCode: 404 });

    contaTravada(null);
    await expect(excluirConta(8)).rejects.toMatchObject({ statusCode: 404 });

    expect(consultasCom('UPDATE users')).toHaveLength(0);
  });

  it('conta com senha exige a senha antes de qualquer escrita', async () => {
    contaTravada({ id: 7, senha: '$argon2id$v=19$m=19456,t=2,p=1$invalido', excluido_em: null });

    await expect(excluirConta(7)).rejects.toMatchObject({ statusCode: 400, code: 'SENHA_INCORRETA' });
    await expect(excluirConta(7, 'qualquer')).rejects.toMatchObject({ code: 'SENHA_INCORRETA' });
    expect(consultasCom('UPDATE users')).toHaveLength(0);
  });
});
