import { Client } from 'minio';
import { env } from '@config/env.js';

let cliente: Client | null = null;

function obterCliente(): Client {
  if (!cliente) {
    cliente = new Client({
      endPoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
      useSSL: env.MINIO_USE_SSL,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
    });
  }
  return cliente;
}

export function urlPublica(chave: string): string {
  return `${env.MINIO_PUBLIC_URL.replace(/\/$/, '')}/${env.MINIO_BUCKET}/${chave}`;
}

export async function enviarObjeto(
  chave: string,
  conteudo: Buffer,
  contentType: string,
): Promise<string> {
  const client = obterCliente();

  if (!(await client.bucketExists(env.MINIO_BUCKET))) {
    await client.makeBucket(env.MINIO_BUCKET);
  }

  await client.putObject(env.MINIO_BUCKET, chave, conteudo, conteudo.length, {
    'Content-Type': contentType,
  });

  return urlPublica(chave);
}

export async function removerObjeto(chave: string): Promise<void> {
  await obterCliente().removeObject(env.MINIO_BUCKET, chave);
}
