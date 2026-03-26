import { create } from 'zustand';
import { getCurrentUser } from '../actions/auth.actions';
import { UserProfile } from '../schemas/auth.schemas';

export interface AuthState {
  user: { id: string } | null;
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  setAuthData: (data: { user: AuthState['user']; profile: UserProfile | null; error?: string | null }) => void;
  resetAuth: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: false,
  error: null,
  setAuthData: ({ user, profile, error = null }) => set({ user, profile, error }),
  resetAuth: () => set({ user: null, profile: null, error: null }),
  refreshUser: async () => {
    try {
      set({ isLoading: true, error: null });
      const { user, profile, error } = await getCurrentUser();
      set({ user, profile, isLoading: false, error: error || null });
      
      if (error) {
        console.error('Error from getCurrentUser:', error);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to refresh user data' 
      });
    }
  }
}));
