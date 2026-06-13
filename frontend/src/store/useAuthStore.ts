import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface AuthUser {
    name: string;
    phone: string;
    [key: string]: unknown;
}

interface AuthState {
    token: string | null;
    user: AuthUser | null;
    hasHydrated: boolean;
    setSession: (token: string, user: AuthUser) => void;
    logout: () => void;
    setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            hasHydrated: false,
            setSession: (token, user) => set({ token, user }),
            logout: () => set({ token: null, user: null }),
            setHasHydrated: (hasHydrated) => set({ hasHydrated }),
        }),
        {
            name: 'viabras-auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: ({ token, user }) => ({ token, user }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        },
    ),
);
