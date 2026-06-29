import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface AuthUser {
    name: string;
    phone: string;
    nome?: string | null;
    telefone?: string | null;
    [key: string]: unknown;
}

interface AuthState {
    token: string | null;
    user: AuthUser | null;
    hasHydrated: boolean;
    setSession: (token: string, user: AuthUser) => void;
    updateUser: (userPatch: Partial<AuthUser>) => void;
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
            updateUser: (userPatch) => set((state) => ({
                user: state.user ? { ...state.user, ...userPatch } : state.user,
            })),
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
