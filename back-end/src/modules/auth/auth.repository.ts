import { Pool } from 'pg';

export type UserRole = 'citizen' | 'specialist' | 'organization';

export interface IUser {
  id: number;
  nome: string;
  email: string;
  senha: string;
  role: UserRole;
  peso_voto: number;
  criado_em: Date;
}

export class AuthRepository {
  constructor(private db: Pool) {}

  async findUserByEmail(email: string): Promise<IUser | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.db.query<IUser>(query, [email]);
    return result.rows[0] || null;
  }

  async findUserById(id: number): Promise<IUser | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.db.query<IUser>(query, [id]);
    return result.rows[0] || null;
  }

  async createUser(user: {
    nome: string;
    email: string;
    passwordHash: string;
    role: UserRole;
  }): Promise<IUser> {
    const query = `
      INSERT INTO users (nome, email, senha, role, peso_voto)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const weight = user.role === 'specialist' ? 3 : 1;
    const result = await this.db.query<IUser>(query, [
      user.nome,
      user.email,
      user.passwordHash,
      user.role,
      weight,
    ]);

    return result.rows[0];
  }
}
