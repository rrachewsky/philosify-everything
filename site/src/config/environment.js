// Environment configuration
// VITE_API_URL must be explicitly set via .env.local (dev) or .env.production (prod)

const rawApiUrl = import.meta.env.VITE_API_URL;

if (!rawApiUrl) {
  throw new Error('VITE_API_URL environment variable is required');
}

// Normalize common misconfigurations:
// - trailing slash: https://api.philosify.org/
// - accidental /api suffix: https://api.philosify.org/api
let apiUrl = String(rawApiUrl).trim().replace(/\/+$/, '');
if (apiUrl.endsWith('/api')) {
  apiUrl = apiUrl.slice(0, -4);
}

export const config = {
  apiUrl,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

export default config;
