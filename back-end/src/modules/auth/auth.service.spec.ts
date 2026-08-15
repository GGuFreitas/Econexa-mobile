import { describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { LoginUserService } from './login-user.service.js';
import { RegisterUserService } from './register-user.service.js';

describe('LoginUserService', () => {
  it('should authenticate a valid user and return a token', async () => {
    const passwordHash = await bcrypt.hash('Senha123', 10);
    const repository = {
      findUserByEmail: vi.fn().mockResolvedValue({
        id: 1,
        nome: 'Ana',
        email: 'ana@email.com',
        senha: passwordHash,
        role: 'citizen',
        peso_voto: 1,
        criado_em: new Date(),
      }),
    };

    const service = new LoginUserService(repository as any);
    const result = await service.execute({
      email: 'ana@email.com',
      password: 'Senha123',
    });

    expect(result.user.email).toBe('ana@email.com');
    expect(result.token).toBeTruthy();
  });
});

describe('RegisterUserService', () => {
  it('should hash the password and persist the user', async () => {
    const repository = {
      createUser: vi.fn().mockImplementation(async (payload) => ({
        id: 2,
        nome: payload.nome,
        email: payload.email,
        senha: payload.passwordHash,
        role: payload.role,
        peso_voto: payload.role === 'specialist' ? 3 : 1,
        criado_em: new Date(),
      })),
      findUserByEmail: vi.fn().mockResolvedValue(null),
    };

    const service = new RegisterUserService(repository as any);
    const user = await service.execute({
      nome: 'Bruno',
      email: 'bruno@email.com',
      password: 'Senha123',
      role: 'specialist',
    });

    expect(repository.createUser).toHaveBeenCalledTimes(1);
    expect(user.email).toBe('bruno@email.com');
    expect(user.passwordHash).not.toBe('Senha123');
  });
});
