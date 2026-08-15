import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@config': resolve(__dirname, './src/config'),
      '@shared': resolve(__dirname, './src/shared'),
      '@modules': resolve(__dirname, './src/modules'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.spec.ts'],
    env: {
      NODE_ENV: 'test',
      PORT: '5000',
      DATABASE_URL: 'postgresql://admin:senha_secreta@localhost:5432/mutira_db',
      CORS_ORIGINS: 'http://localhost:19006,http://localhost:3000',
      GOOGLE_API_KEY: 'test-google-key',
      JWT_SECRET: 'test-secret-key-123456',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
