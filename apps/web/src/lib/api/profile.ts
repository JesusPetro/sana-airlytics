import { apiClient } from './client';

export interface UserProfileResponse {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  phone: string | null;
  address: string | null;
  type: string | null;
  is_active: boolean;
}

export interface UpdateProfileBody {
  first_name?: string | null;
  last_name?: string | null;
  middle_name?: string | null;
  phone?: string | null;
  address?: string | null;
}

export function getProfile(): Promise<UserProfileResponse> {
  return apiClient<UserProfileResponse>('/api/v1/auth/profile');
}

export function updateProfile(body: UpdateProfileBody): Promise<void> {
  return apiClient('/api/v1/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deleteAccount(): Promise<void> {
  return apiClient('/api/v1/auth/account', {
    method: 'DELETE',
  });
}
