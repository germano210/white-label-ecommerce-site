import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const isCookieAuthMode = import.meta.env.VITE_AUTH_MODE === 'cookie';

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
    setSession: (token: string | null, user: AuthUser) => void;
    setUser: (user: AuthUser | null) => void;
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
            setUser: (user) => set({ user }),
            updateUser: (userPatch) => set((state) => ({
                user: state.user ? { ...state.user, ...userPatch } : state.user,
            })),
            logout: () => set({ token: null, user: null }),
            setHasHydrated: (hasHydrated) => set({ hasHydrated }),
        }),
        {
            name: 'viabras-auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: ({ token, user }) => ({
                token: isCookieAuthMode ? null : token,
                user,
            }),
            onRehydrateStorage: () => (state) => {
                if (isCookieAuthMode) {
                    if (state?.user) {
                        state.setSession(null, state.user);
                    } else {
                        state?.logout();
                    }
                }

                state?.setHasHydrated(true);
            },
        },
    ),
);
