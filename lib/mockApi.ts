import { User } from '../types';

const DB_KEYS = {
  AUTH_TOKEN: 'pawar_lab_auth_token',
};

export const mockApi = {
  login: async (username: string, password: string): Promise<User> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const user = await response.json();
      const sessionUser = { ...user, token: `mock-jwt-${user._id}-${Date.now()}` };
      localStorage.setItem(DB_KEYS.AUTH_TOKEN, JSON.stringify(sessionUser));
      return sessionUser;
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Unauthorized Access');
    }
  },

  logout: () => {
    localStorage.removeItem(DB_KEYS.AUTH_TOKEN);
  },

  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(DB_KEYS.AUTH_TOKEN);
    return data ? JSON.parse(data) : null;
  },
};