// Config barrel file
import { config } from './environment.js';

export { config };
export const getApiUrl = () => config.apiUrl;
