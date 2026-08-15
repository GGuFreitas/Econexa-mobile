import 'dotenv/config';
import {z} from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().nonempty(),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  GOOGLE_API_KEY: z.string().nonempty(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET deve ter ao menos 16 caracteres.'),
})

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('Variáveis de ambiente invalidas!', _env.error.format());
  process.exit(1);
}

export const env = _env.data;