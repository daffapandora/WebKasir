/**
 * api-client.ts
 *
 * Thin wrapper di atas fetch untuk komunikasi ke Laravel REST API.
 * Base URL diambil dari environment variable NEXT_PUBLIC_API_URL.
 * Token Sanctum diambil dari localStorage (set oleh auth-store).
 */

let baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
if (!baseUrl.endsWith('/api')) {
  baseUrl = `${baseUrl.replace(/\/$/, '')}/api`;
}
const BASE_URL = baseUrl;

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sanctum_token');
}

async function request<T>(
  method: string,
  path: string,
  options: {
    body?: unknown;
    params?: Record<string, string | number | boolean | undefined>;
  } = {}
): Promise<{ data: T; status: number }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Build query string
  let url = `${BASE_URL}${path}`;
  if (options.params) {
    const qs = Object.entries(options.params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const json = await res.json();
      message = json?.message ?? message;
    } catch {
      // ignore
    }
    const err = new Error(message) as Error & { status: number; response?: { data?: unknown } };
    err.status = res.status;
    throw err;
  }

  // 204 No Content
  if (res.status === 204) return { data: null as T, status: 204 };

  const data: T = await res.json();
  return { data, status: res.status };
}

export const apiClient = {
  get<T>(path: string, options?: { params?: Record<string, string | number | boolean | undefined> }) {
    return request<T>('GET', path, options);
  },
  post<T>(path: string, body?: unknown) {
    return request<T>('POST', path, { body });
  },
  put<T>(path: string, body?: unknown) {
    return request<T>('PUT', path, { body });
  },
  patch<T>(path: string, body?: unknown) {
    return request<T>('PATCH', path, { body });
  },
  delete<T = void>(path: string) {
    return request<T>('DELETE', path);
  },
};
