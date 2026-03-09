// Logger utility - only logs in development mode
const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args) => isDev && console.log(...args),
  info: (...args) => isDev && console.info(...args),
  warn: (...args) => isDev && console.warn(...args),
  error: (...args) => console.error(...args), // Always log errors
  debug: (...args) => isDev && console.debug(...args),
};

export default logger;
