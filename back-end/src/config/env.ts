import 'dotenv/config';
import {z} from 'zod';

const booleano = z
  .enum(['true', 'false'])
  .default('false')
  .transform((valor) => valor === 'true');

const listaSeparadaPorVirgula = z
  .string()
  .default('')
  .transform((valor) =>
    valor
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(5000),
    DATABASE_URL: z.string().nonempty(),
    CORS_ORIGINS: z.string().default('http://localhost:3000'),
    JWT_SECRET: z.string().min(16, 'JWT_SECRET deve ter ao menos 16 caracteres.'),
    ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
    APP_PUBLIC_URL: z.string().default('http://localhost:19006'),
    API_PUBLIC_URL: z
      .url({ protocol: /^https?$/, error: 'API_PUBLIC_URL deve ser uma URL http(s).' })
      .default('http://localhost:5000')
      .transform((valor) => valor.replace(/\/+$/, '')),
    GOOGLE_CLIENT_IDS: listaSeparadaPorVirgula,
    CONTATO_PRIVACIDADE: z.email().default('privacidade@mutira.local'),
    MINIO_ENDPOINT: z.string().default('localhost'),
    MINIO_PORT: z.coerce.number().default(9000),
    MINIO_USE_SSL: booleano,
    MINIO_ACCESS_KEY: z.string().default('minioadmin'),
    MINIO_SECRET_KEY: z.string().default('minioadmin123'),
    MINIO_BUCKET: z.string().default('econexa-evidencias'),
    MINIO_PUBLIC_URL: z.string().default('http://localhost:9000'),
    SMTP_HOST: z.string().default('localhost'),
    SMTP_PORT: z.coerce.number().default(1025),
    SMTP_SECURE: booleano,
    SMTP_USER: z.string().default(''),
    SMTP_PASS: z.string().default(''),
    SMTP_FROM: z.string().default('Mutira <nao-responda@mutira.local>'),
    SMTP_DEV_INBOX: z.string().default('caixa-dev@mutira.local'),
    SMTP_ALLOW_EXTERNAL: booleano,
  })
  .refine((valores) => valores.NODE_ENV !== 'production' || valores.JWT_SECRET.length >= 32, {
    message: 'Em produção, JWT_SECRET deve ter ao menos 32 caracteres.',
    path: ['JWT_SECRET'],
  });

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('Variáveis de ambiente invalidas!', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
