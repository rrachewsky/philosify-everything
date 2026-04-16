const API_URL = import.meta.env.VITE_API_URL || 'https://api.philosify.org';

function parseResponseBody(text, response) {
  if (!text) {
    return {};
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      return { error: 'Invalid JSON response from server.' };
    }
  }

  return { error: text };
}

class ApiService {
  async request(method, endpoint, options = {}) {
    const {
      body,
      headers = {},
      credentials = 'include',
      rawBody,
    } = options;

    const requestHeaders = { ...headers };
    const requestOptions = {
      method,
      headers: requestHeaders,
      credentials,
    };

    if (rawBody !== undefined) {
      requestOptions.body = rawBody;
    } else if (body !== undefined) {
      requestHeaders['Content-Type'] = 'application/json';
      requestOptions.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}/api${endpoint}`, requestOptions);
    const text = await response.text();
    const data = parseResponseBody(text, response);

    if (!response.ok) {
      const error = new Error(data.error || `HTTP ${response.status}`);
      error.status = response.status;
      error.payload = data;
      throw error;
    }

    return data;
  }

  get(endpoint, options) {
    return this.request('GET', endpoint, options);
  }

  post(endpoint, body, options = {}) {
    return this.request('POST', endpoint, { ...options, body });
  }

  put(endpoint, body, options = {}) {
    return this.request('PUT', endpoint, { ...options, body });
  }

  delete(endpoint, options) {
    return this.request('DELETE', endpoint, options);
  }

  async uploadFile(endpoint, file, headers = {}) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request('POST', endpoint, {
      headers,
      rawBody: formData,
    });
  }

  // SECURITY NOTE: Old adminGet/adminPost/adminDelete methods removed
  // Admin authentication now uses HTTPOnly cookies (CVE-2026-001 fix)
  // Use regular api.get/post/delete - cookies are sent automatically
}

export const api = new ApiService();
export default api;
