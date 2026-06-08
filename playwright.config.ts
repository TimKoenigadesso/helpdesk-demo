import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './frontend/tests',
  use: { baseURL: process.env['FRONTEND_URL'] ?? 'http://localhost:5173' },
});
