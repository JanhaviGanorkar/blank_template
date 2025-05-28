import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Create store
export const useAuthStore = create(
  persist(
    (set) => ({
      // User state
      user: null,
      isAuthenticated: false,

      login: (user) => {
        set({ user, isAuthenticated: true });
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