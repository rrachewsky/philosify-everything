import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // Allow network access from other devices
      port: 3000,
      open: true,
    },
    build: {
      outDir: 'dist',
      // SECURITY: never ship browser sourcemaps in production (prevents full source disclosure)
      sourcemap: !isProd,
      target: 'es2020', // Vite 6: Explicit build target for broader compatibility
      // SECURITY: Disable module preload polyfill to eliminate the only inline script
      // in production builds, allowing removal of 'unsafe-inline' from CSP script-src.
      // Native <link rel="modulepreload"> is supported by all es2020-capable browsers.
      modulePreload: { polyfill: false },
      // Ensure compatibility with Cloudflare Pages
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            stripe: ['@stripe/stripe-js'],
            i18n: ['react-i18next', 'i18next'],
          },
        },
      },
    },
    // Strip console/debugger in production bundles (keeps public console clean)
    esbuild: isProd ? { drop: ['console', 'debugger'] } : undefined,
    resolve: {
      alias: {
        '@': '/src',
        '@components': '/src/components',
        '@services': '/src/services',
        '@hooks': '/src/hooks',
        '@utils': '/src/utils',
        '@contexts': '/src/contexts',
        '@styles': '/src/styles',
      },
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', '@stripe/stripe-js'],
    },
  };
});
