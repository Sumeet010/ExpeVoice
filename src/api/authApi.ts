import { UserProfile } from '../types';
import { request } from './apiClient';

export const authApi = {
  async getCurrentUser(): Promise<UserProfile> {
    const res = await request<{ user: UserProfile }>('/api/auth/me');
    return res.user;
  },

  async loginWithGoogle(credentialOrProfile: {
    credential?: string;
    profile?: any;
    email?: string;
    name?: string;
  }): Promise<{ user: UserProfile; token: string }> {
    const res = await request<{ success: boolean; token: string; user: UserProfile }>(
      '/api/auth/google',
      {
        method: 'POST',
        body: JSON.stringify(credentialOrProfile),
      }
    );
    if (res.token) {
      sessionStorage.setItem('vocal_auth_token', res.token);
    }
    return { user: res.user, token: res.token };
  },

  async logout(): Promise<void> {
    sessionStorage.removeItem('vocal_auth_token');
    await request('/api/auth/logout', { method: 'POST' });
  },
};
