import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  user: { id: string; email: string; name?: string; } | null; // Added 'name' for consistency
  login: (id: string, email: string, name?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  login: (id, email, name) => set({ isAuthenticated: true, user: { id, email, name } }),
  logout: () => set({ isAuthenticated: false, user: null }),
}));

