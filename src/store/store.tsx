import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// Store interface
interface AuthState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

// Create store
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // User state
      user: null,
      isAuthenticated: false,

      login: (user: User) => {
        set({ user, isAuthenticated: true });
        console.log(user)
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Convenience hooks
export const useAuth = () => {
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const login = useAuthStore(state => state.login);
  const logout = useAuthStore(state => state.logout);
  
  return {
    user,
    isAuthenticated,
    login,
    logout,
  };
};