import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

const bancoDeIntegracao =
  process.env.DATABASE_URL_ITEST ??
  'postgresql://admin:senha_secreta@localhost:5432/econexa_itest';

process.env.DATABASE_URL = bancoDeIntegracao;

export default defineConfig({
  resolve: {
    alias: {
      '@config': resolve(__dirname, './src/config'),
      '@shared': resolve(__dirname, './src/shared'),
      '@common': resolve(__dirname, './src/common'),
      '@features': resolve(__dirname, './src/features'),
      '@routes': resolve(__dirname, './src/routes'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.itest.ts'],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000,
    globalSetup: ['./src/tests/integracao/preparar.ts'],
    env: {
      NODE_ENV: 'test',
      PORT: '5000',
      DATABASE_URL: bancoDeIntegracao,
      CORS_ORIGINS: 'http://localhost:19006,http://localhost:3000',
      GOOGLE_API_KEY: 'test-google-key',
      JWT_SECRET: 'test-secret-key-123456',
    },
  },
});
