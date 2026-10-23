import { getCurrentUser } from '@/lib/appwrite';
import { User } from '@/type';
import { create } from 'zustand';
import { signOut as appwriteSignOut } from '@/lib/appwrite'; // Import your lib function

type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;


  setIsAuthenticated : (value: boolean) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;

  fetchAuthenticatedUser: () => Promise<void>;
  signOut: () => Promise<void>;


  
}


const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: true,

  setIsAuthenticated: (value) => set({isAuthenticated: value}),
  setUser: (user) => set({user}),
  setLoading: (value) => set({isLoading: value}),

    signOut: async () => {
    try {
      await appwriteSignOut(); // Call the Appwrite API
      set({ user: null, isAuthenticated: false }); // Update local state
    } catch (e) {
      console.error("Logout failed", e);
    }
  },


  fetchAuthenticatedUser: async () => {
    set({isLoading: true});

    try {
      const user = await getCurrentUser();

      if (user) set({isAuthenticated: true, user: (user as unknown) as User})
      else set({isAuthenticated: false, user: null});
      
    } catch (e) {
        console.log('fetAuthenticatedUser error', e);
        set({isAuthenticated: false, user: null})
      
    } finally{
        set({isLoading: false});
    }
  }



}))

export default useAuthStore