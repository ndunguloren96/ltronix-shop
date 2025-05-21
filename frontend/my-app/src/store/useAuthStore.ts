import { create } from 'zustand';

interface AuthState {
    isAuthenticated: boolean;
    user: { id: string; email: string } | null;
    login: (id: string, email: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    user: null,
    login: (id, email) => set({ isAuthenticated: true, user: { id, email } }),
    logout: () => set({ isAuthenticated: false, user: null }),
}));