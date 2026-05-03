import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from './auth';

const AUTH_URL = process.env['NEXT_PUBLIC_AUTH_SERVICE_URL'] ?? 'http://localhost:3001';
const USER_URL = process.env['NEXT_PUBLIC_USER_SERVICE_URL'] ?? 'http://localhost:3002';
const ATTENDANCE_URL = process.env['NEXT_PUBLIC_ATTENDANCE_SERVICE_URL'] ?? 'http://localhost:3003';
const SCHEDULE_URL = process.env['NEXT_PUBLIC_SCHEDULE_SERVICE_URL'] ?? 'http://localhost:3004';

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${AUTH_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const data = (await res.json()) as {
      data: { accessToken: string; refreshToken: string };
    };
    saveTokens(data.data);
    return data.data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

function makeClient(baseUrl: string) {
  async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
    const token = getAccessToken();

    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });

    if (res.status === 401 && retry) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return request<T>(path, init, false);
      }
      throw new Error('Session expired. Please login again.');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
    }

    return res.json() as Promise<T>;
  }

  return {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body: unknown) =>
      request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
    put: <T>(path: string, body: unknown) =>
      request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
    patch: <T>(path: string, body?: unknown) =>
      request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
    delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  };
}

export const apiClient = makeClient(AUTH_URL);
export const userApiClient = makeClient(USER_URL);
export const attendanceApiClient = makeClient(ATTENDANCE_URL);
export const scheduleApiClient = makeClient(SCHEDULE_URL);
