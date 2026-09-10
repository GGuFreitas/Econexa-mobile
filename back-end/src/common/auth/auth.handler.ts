import { hash, verify } from '@node-rs/argon2';
import jwt from 'jsonwebtoken';
import { AppError } from '@shared/errors.js';
import { env } from '@config/env.js';
import * as sql from './auth.sql.js';
import type { LoginInput, PublicUser, RegisterInput } from './auth.types.js';

function toPublic(row: { id: number; nome: string; email: string; role: string; peso_voto: number }): PublicUser {
  return {
    id: row.id,
    name: row.nome,
    email: row.email,
    role: row.role as PublicUser['role'],
    vote_weight: row.peso_voto,
  };
}

export async function registerUser(input: RegisterInput) {
  const nome = input.nome.trim();
  const email = input.email.trim().toLowerCase();

  if (!nome || !email || !input.password) {
    throw new AppError('Nome, e-mail e senha são obrigatórios.', 400);
  }

  if (input.password.length < 6) {
    throw new AppError('A senha deve ter ao menos 6 caracteres.', 400);
  }

  const existing = await sql.findUserByEmail(email);
  if (existing) {
    throw new AppError('Já existe um usuário cadastrado com este e-mail.', 409);
  }

  const passwordHash = await hash(input.password);
  const created = await sql.insertUser({ nome, email, passwordHash, role: 'citizen' });

  return { user: toPublic(created) };
}

export async function loginUser(input: LoginInput) {
  const email = input.email.trim().toLowerCase();
  const user = await sql.findUserByEmail(email);

  if (!user) {
    throw new AppError('E-mail ou senha incorretos.', 401);
  }

  const isPasswordValid = await verify(user.senha, input.password);
  if (!isPasswordValid) {
    throw new AppError('E-mail ou senha incorretos.', 401);
  }

  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: '7d' },
  );

  return { token, user: toPublic(user) };
}

export async function getMe(userId: number) {
  const user = await sql.findUserById(userId);
  if (!user) {
    throw new AppError('Usuário não encontrado.', 404);
  }
  return { user: toPublic(user) };
}
