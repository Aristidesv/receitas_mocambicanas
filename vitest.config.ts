import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node', // Ambiente padrão: Node (sem DOM)
    setupFiles: [],
    include: ['**/*.test.{ts,tsx,js}'],
    environmentMatchGlobs: [
      // Use jsdom apenas para testes de componentes React
      ['src/**/*.test.{ts,tsx}', 'jsdom'],
      // Mantenha ambiente Node para testes de servidor e API
      ['server/**/*.test.js', 'node'],
      ['api/**/*.test.js', 'node'],
    ],
  },
});
