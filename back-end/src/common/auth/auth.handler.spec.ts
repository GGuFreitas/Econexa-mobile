import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hash } from '@node-rs/argon2';
import { dbPool } from '@config/database.js';
import { loginUser, registerUser } from './auth.handler.js';

vi.mock('@config/database.js', () => ({
  dbPool: { query: vi.fn() },
}));

const mockQuery = dbPool.query as unknown as ReturnType<typeof vi.fn>;

describe('auth handlers', () => {
  beforeEach(() => mockQuery.mockReset());

  it('registra um novo usuário quando o e-mail não existe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, nome: 'Ana', email: 'ana@exemplo.com', role: 'citizen', peso_voto: 1 }],
    });

    const result = await registerUser({ nome: 'Ana', email: 'ana@exemplo.com', password: 'Senha123' });

    expect(result.user.email).toBe('ana@exemplo.com');
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  it('lança AppError quando o e-mail já está cadastrado', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 9, nome: 'Ana', email: 'ana@exemplo.com', role: 'citizen', peso_voto: 1 }],
    });

    await expect(
      registerUser({ nome: 'Ana', email: 'ana@exemplo.com', password: 'Senha123' }),
    ).rejects.toThrow('Já existe um usuário');
  });

  it('autentica com credenciais válidas', async () => {
    const passwordHash = await hash('Senha123');
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, nome: 'Ana', email: 'ana@exemplo.com', senha: passwordHash, role: 'citizen', peso_voto: 1 }],
    });

    const result = await loginUser({ email: 'ana@exemplo.com', password: 'Senha123' });

    expect(result.token).toBeTruthy();
    expect(result.user.email).toBe('ana@exemplo.com');
  });
});
