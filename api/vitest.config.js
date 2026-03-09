import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.config.js',
        'index.js' // Main worker file (integration tests handle this)
      ]
    },
    // Allow tests to use ES modules
    deps: {
      inline: true
    }
  }
});
