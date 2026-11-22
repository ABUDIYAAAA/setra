import { apiClient } from './client';
import { UserProfile } from '../storage/userCache';

export interface GoogleAuthResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  getGoogleUrl: async (state?: string): Promise<string> => {
    const res = await apiClient.get('/auth/google/url', {
      params: state ? { state } : undefined,
    });
    return res.data.data.url;
  },

  authenticateWithGoogle: async (credentials: {
    idToken?: string;
    accessToken?: string;
    code?: string;
  }): Promise<GoogleAuthResponse> => {
    const res = await apiClient.post('/auth/google', credentials);
    return res.data.data;
  },

  getProfile: async (): Promise<UserProfile> => {
    const res = await apiClient.get('/auth/me');
    return res.data.data.user;
  },

  logout: async (refreshToken?: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken });
  },
};
