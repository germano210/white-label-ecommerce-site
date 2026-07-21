import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Role = 'ADMIN' | 'VENDEDOR';

export interface AdminUser {
    id: string;
    name: string;
    email?: string | null;
    role: Role;
}

interface AdminState {
    currentUser: AdminUser | null;
    token: string | null;
    login: (user: AdminUser, token: string) => void;
    logout: () => void;
    setToken: (token: string | null) => void;
}

export const useAdminStore = create<AdminState>()(
    persist(
        (set) => ({
            currentUser: null,
            token: null,

            login: (user, token) => set({ currentUser: user, token }),
            logout: () => set({ currentUser: null, token: null }),
            setToken: (token) => set({ token }),
        }),
        {
            name: 'viabras-admin-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: ({ currentUser, token }) => ({
                currentUser,
                token,
            }),
        },
    ),
);
