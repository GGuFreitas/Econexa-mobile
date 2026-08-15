import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '@config/env.js';
import { AuthRepository } from './auth.repository.js';
import { AppError } from '@shared/errors/errorHandler.js';

export type LoginUserInput = {
  email: string;
  password: string;
};

export class LoginUserService {
  constructor(private repository: AuthRepository) {}

  async execute(input: LoginUserInput) {
    const email = input.email.trim().toLowerCase();
    const user = await this.repository.findUserByEmail(email);

    if (!user) {
      throw new AppError('E-mail ou senha incorretos.', 401);
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.senha);

    if (!isPasswordValid) {
      throw new AppError('E-mail ou senha incorretos.', 401);
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.nome,
        email: user.email,
        role: user.role,
        vote_weight: user.peso_voto,
      },
    };
  }
}
