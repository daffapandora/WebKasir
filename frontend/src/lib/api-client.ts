/**
 * api-client.ts
 *
 * HTTP client for communication with the Laravel REST API.
 * Features:
 * - Sanctum token-based auth (Bearer token from localStorage)
 * - Retry with exponential backoff (3 retries: 1s, 2s, 4s)
 * - 401 auto-logout interceptor
 * - Consistent error handling
 */
import { useAuthStore } from '@/store/auth-store';

/* ── Config ── */
let baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
if (!baseUrl.endsWith('/api')) {
  baseUrl = `${baseUrl.replace(/\/$/, '')}/api`;
}
const BASE_URL = baseUrl;

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // exponential backoff in ms

/* ── Token management ── */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sanctum_token');
}

function clearAuthState(): void {
  if (typeof window === 'undefined') return;
  
  try {
    useAuthStore.getState().logout();
  } catch (e) {
    localStorage.removeItem('sanctum_token');
    localStorage.removeItem('pos-auth');
  }

  // Redirect to login
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

/* ── Retry helper ── */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableError(status: number): boolean {
  // Retry on 5xx server errors, 408 timeout, 429 rate limit
  return status >= 500 || status === 408 || status === 429;
}

function isRetryableMethod(method: string): boolean {
  // Only retry idempotent methods
  return ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'].includes(method.toUpperCase());
}

/* ── Core request function ── */
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

  const fetchOptions: RequestInit = {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  };

  // Retry logic
  const shouldRetry = isRetryableMethod(method);
  let lastError: Error | null = null;
  const attempts = shouldRetry ? MAX_RETRIES : 1;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await fetch(url, fetchOptions);

      // 401 Unauthorized — session expired or invalid token
      if (res.status === 401) {
        clearAuthState();
        const err = new Error('Sesi Anda telah berakhir. Silakan login kembali.') as Error & { status: number };
        err.status = 401;
        throw err;
      }

      // Retryable server error
      if (isRetryableError(res.status) && shouldRetry && attempt < attempts - 1) {
        const delay = RETRY_DELAYS[attempt] || 4000;
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[API] ${method} ${path} returned ${res.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${attempts})`);
        }
        await sleep(delay);
        continue;
      }

      // Non-OK response — throw with server message
      if (!res.ok) {
        let message = `HTTP ${res.status}`;
        try {
          const json = await res.json();
          message = json?.message ?? message;
        } catch {
          // ignore JSON parse error
        }
        const err = new Error(message) as Error & { status: number; response?: { data?: unknown } };
        err.status = res.status;
        throw err;
      }

      // 204 No Content
      if (res.status === 204) return { data: null as T, status: 204 };

      const data: T = await res.json();
      return { data, status: res.status };

    } catch (err: any) {
      // Already handled 401 above — re-throw
      if (err.status === 401) throw err;

      // Network error (fetch failed) — retry if idempotent
      if (err.name === 'TypeError' && shouldRetry && attempt < attempts - 1) {
        const delay = RETRY_DELAYS[attempt] || 4000;
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[API] ${method} ${path} network error, retrying in ${delay}ms (attempt ${attempt + 1}/${attempts})`);
        }
        lastError = err;
        await sleep(delay);
        continue;
      }

      // Final attempt failed — wrap with user-friendly message
      if (err.name === 'TypeError') {
        const networkErr = new Error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.') as Error & { status: number };
        networkErr.status = 0;
        throw networkErr;
      }

      throw err;
    }
  }

  // Should not reach here, but safeguard
  throw lastError || new Error('Request gagal setelah beberapa percobaan');
}

/* ── Exported API client ── */
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
