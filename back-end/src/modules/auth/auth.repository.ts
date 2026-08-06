import { Pool } from "pg";

export interface IUser{
  id: number;
  nome: string;
  email: string;
  senha: string;
  role: 'citizen' | 'specialist' | 'organization';
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
  async createUser(user: any): Promise<void> {
    const query = 'INSERT INTO users (nome, email, senha, role, peso_voto) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    const weight = user.role === 'specialist' ? 3 : 1;
    await this.db.query(query, [user.name, user.email, user.passwordHash, user.role, weight]);  }
}