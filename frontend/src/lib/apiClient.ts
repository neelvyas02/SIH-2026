const API_BASE = '/api/v1';

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('borderguard_token');
};

export const setAuthToken = (token: string | null | undefined): void => {
  if (typeof window !== 'undefined') {
    if (token && token !== 'null' && token !== 'undefined') {
      localStorage.setItem('borderguard_token', token);
    } else {
      localStorage.removeItem('borderguard_token');
    }
  }
};

export const clearAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('borderguard_token');
  }
};

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http') || endpoint.startsWith('/api')
    ? endpoint
    : `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuthToken();
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) return null as unknown as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T>(url: string, init?: RequestInit): Promise<T> =>
    request<T>(url, { method: 'GET', ...init }),

  post: <T>(url: string, body?: any, init?: RequestInit): Promise<T> => {
    const isFormData = body instanceof FormData;
    const headers = new Headers(init?.headers || {});
    if (!isFormData && body !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    return request<T>(url, {
      method: 'POST',
      headers,
      body: isFormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
      ...init,
    });
  },

  put: <T>(url: string, body?: any, init?: RequestInit): Promise<T> => {
    const isFormData = body instanceof FormData;
    const headers = new Headers(init?.headers || {});
    if (!isFormData && body !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    return request<T>(url, {
      method: 'PUT',
      headers,
      body: isFormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
      ...init,
    });
  },

  patch: <T>(url: string, body?: any, init?: RequestInit): Promise<T> => {
    const isFormData = body instanceof FormData;
    const headers = new Headers(init?.headers || {});
    if (!isFormData && body !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    return request<T>(url, {
      method: 'PATCH',
      headers,
      body: isFormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
      ...init,
    });
  },

  delete: <T>(url: string, init?: RequestInit): Promise<T> =>
    request<T>(url, { method: 'DELETE', ...init }),
};

export const mockDelay = <T>(data: T, delayMs: number = 100): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), delayMs));

export const clone = <T>(data: T): T => {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(data);
    } catch {
      // fallback
    }
  }
  return JSON.parse(JSON.stringify(data));
};
