import { create } from 'zustand';

// User interface for a logged-in user
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

// State interface for the authentication store
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
  // A function to check for auth status on app load
  checkAuth: () => Promise<void>;
}

/**
 * Zustand store for managing user authentication state.
 * This store handles the user object, authentication status, and a loading state.
 */
export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  loading: true, // Set to true initially to handle the checkAuth call

  /**
   * Sets the user as authenticated and stores their data.
   * @param user The user object containing id, email, and optional names.
   */
  login: (user: User) => set({ isAuthenticated: true, user }),

  /**
   * Logs out the user by clearing their data and setting isAuthenticated to false.
   */
  logout: () => {
    // In a real application, you would also clear the JWT token from storage
    // localStorage.removeItem('authToken');
    set({ isAuthenticated: false, user: null });
  },

  /**
   * Simulates an asynchronous check for authentication status.
   * In a real application, this would make an API call or check for a token.
   */
  checkAuth: async () => {
    // Simulating an API call to check for a token or user session
    set({ loading: true }); // Start loading
    try {
      // For demonstration, let's assume a user is authenticated
      // if a token exists in a simulated storage.
      // In your Next.js app, this would be a call to your Django backend API
      // to validate a cookie or token.
      // Example:
      // const response = await fetch('/api/check-session');
      // if (response.ok) {
      //   const userData = await response.json();
      //   set({ isAuthenticated: true, user: userData, loading: false });
      // } else {
      //   set({ isAuthenticated: false, user: null, loading: false });
      // }
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

      // For now, we'll just set the loading to false.
      // The login/logout state will be managed by the components calling these functions.
      set({ loading: false });
    } catch (error) {
      console.error('Failed to check authentication status:', error);
      set({ isAuthenticated: false, user: null, loading: false });
    }
  },
}));

