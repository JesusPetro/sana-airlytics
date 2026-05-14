import { apiClient } from './client';

export interface MeResponse {
  user_id: string;
  email: string;
  type: string | null;
}

export function login(email: string, password: string): Promise<{ message: string; user_id: string; email: string }> {
  return apiClient('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuthRedirect: true,
  });
}

export function logout(): Promise<void> {
  return apiClient('/api/v1/auth/logout', { method: 'POST', skipAuthRedirect: true });
}

export function me(): Promise<MeResponse> {
  return apiClient<MeResponse>('/api/v1/auth/me', { skipAuthRedirect: true });
}

export function register(body: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  phone?: string;
  address?: string;
}): Promise<{ message: string; user_id: string }> {
  return apiClient('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function requestReset(email: string): Promise<void> {
  return apiClient('/api/v1/auth/request-reset', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token: string, newPassword: string): Promise<void> {
  return apiClient('/api/v1/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password: newPassword }),
  });
}
