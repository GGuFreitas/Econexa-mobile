
// Em produção, use a biblioteca 'bcrypt' para comparar hashes. Exemplo simples abaixo:

import { AuthRepository } from "@modules/auth/auth.repository.js";
import { AppError } from "@shared/errors/errorHandler.js";

export class LoginUserService {
  constructor(private repository: AuthRepository) {}

  async execute(input: any) {
    const user = await this.repository.findUserByEmail(input.email);
    if (!user) throw new AppError('E-mail ou senha incorretos.', 401);

    // TODO: Usar bcrypt.compare(input.password, user.password_hash)
    const isPasswordValid = input.password === user.senha; 
    if (!isPasswordValid) throw new AppError('E-mail ou senha incorretos.', 401);

    return {
      user: {
        id: user.id,
        name: user.nome,
        role: user.role,
        vote_weight: user.peso_voto
      }
    };
  }
}
