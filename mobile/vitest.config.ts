import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@features': resolve(__dirname, './src/features'),
      '@shared': resolve(__dirname, './src/shared'),
      '@store': resolve(__dirname, './src/store'),
      '@navigation': resolve(__dirname, './src/navigation'),
      '@services': resolve(__dirname, './src/services'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    setupFiles: [],
  },
});
