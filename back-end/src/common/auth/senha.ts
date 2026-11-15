import { hash, verify } from '@node-rs/argon2';

let hashFicticio: Promise<string> | null = null;

export function gerarHashDeSenha(senha: string): Promise<string> {
  return hash(senha);
}

export async function conferirSenha(hashSalvo: string, senha: string): Promise<boolean> {
  try {
    return await verify(hashSalvo, senha);
  } catch {
    return false;
  }
}

export async function conferirSenhaFicticia(senha: string): Promise<void> {
  hashFicticio ??= hash('senha-ficticia-para-tempo-constante');
  await conferirSenha(await hashFicticio, senha);
}
