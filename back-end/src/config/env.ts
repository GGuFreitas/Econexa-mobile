import 'dotenv/config';
import {z} from 'zod';

const booleano = z
  .enum(['true', 'false'])
  .default('false')
  .transform((valor) => valor === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().nonempty(),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET deve ter ao menos 16 caracteres.'),
  APP_PUBLIC_URL: z.string().default('http://localhost:19006'),
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_USE_SSL: booleano,
  MINIO_ACCESS_KEY: z.string().default('minioadmin'),
  MINIO_SECRET_KEY: z.string().default('minioadmin123'),
  MINIO_BUCKET: z.string().default('econexa-evidencias'),
  MINIO_PUBLIC_URL: z.string().default('http://localhost:9000'),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_FROM: z.string().default('Mutira <nao-responda@mutira.local>'),
  SMTP_DEV_INBOX: z.string().default('caixa-dev@mutira.local'),
  SMTP_ALLOW_EXTERNAL: booleano,
})

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('Variáveis de ambiente invalidas!', _env.error.format());
  process.exit(1);
}

export const env = _env.data;