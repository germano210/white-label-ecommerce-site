import { create } from 'zustand';

// Tipos de utilizadores
export type Role = 'ADMIN' | 'VENDEDOR' | null;

interface AdminUser {
    id: string;
    name: string;
    role: Role;
}

interface AdminState {
    currentUser: AdminUser | null;
    isAdminModeOpen: boolean; // Controla se a tela de admin está visível

    login: (user: AdminUser) => void;
    logout: () => void;
    toggleAdminMode: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
    currentUser: null,
    isAdminModeOpen: false,

    login: (user) => set({ currentUser: user }),
    logout: () => set({ currentUser: null }),
    toggleAdminMode: () => set((state) => ({ isAdminModeOpen: !state.isAdminModeOpen }))
}));