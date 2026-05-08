interface ApiError {
  status: number;
  message: string;
}

export class ApiRequestError extends Error {
  status: number;
  constructor({ status, message }: ApiError) {
    super(message);
    this.status = status;
  }
}

export async function apiClient<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? '';
  const res = await fetch(`${base}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      const locale = window.location.pathname.split('/')[1] ?? 'es';
      window.location.href = `/${locale}/login`;
    }
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body?.detail ?? body?.message ?? message;
    } catch {}
    throw new ApiRequestError({ status: res.status, message });
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}
