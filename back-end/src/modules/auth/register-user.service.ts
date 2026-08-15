import bcrypt from 'bcryptjs';
import { AuthRepository, type UserRole } from './auth.repository.js';
import { AppError } from '@shared/errors/errorHandler.js';

export type RegisterUserInput = {
  nome: string;
  email: string;
  password: string;
  role?: UserRole;
};

export class RegisterUserService {
  constructor(private repository: AuthRepository) {}

  async execute(input: RegisterUserInput) {
    const nome = input.nome.trim();
    const email = input.email.trim().toLowerCase();

    if (!nome || !email || !input.password) {
      throw new AppError('Nome, e-mail e senha são obrigatórios.', 400);
    }

    if (input.password.length < 6) {
      throw new AppError('A senha deve ter ao menos 6 caracteres.', 400);
    }

    const existingUser = await this.repository.findUserByEmail(email);
    if (existingUser) {
      throw new AppError('Já existe um usuário cadastrado com este e-mail.', 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.repository.createUser({
      nome,
      email,
      passwordHash,
      role: input.role ?? 'citizen',
    });

    return {
      id: user.id,
      name: user.nome,
      email: user.email,
      role: user.role,
      vote_weight: user.peso_voto,
      passwordHash,
    };
  }
}
