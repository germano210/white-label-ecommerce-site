import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type RoletaGuestPendingAction = 'daily' | 'profile' | 'invite' | null;

interface RoletaGuestState {
    isGuestFirstAccess: boolean;
    hasGuestSpun: boolean;
    guestSpinToken: string | null;
    guestPrize: unknown;
    isLoginPromptOpen: boolean;
    pendingAuthAction: RoletaGuestPendingAction;
    continueAsGuestFirstAccess: () => void;
    requestLogin: (pendingAction?: RoletaGuestPendingAction) => void;
    closeLoginPrompt: () => void;
    setGuestSpinResult: (payload: { token: string | null; prize: unknown }) => void;
    clearGuestSpinToken: () => void;
    clearPendingAuthAction: () => void;
    resetGuestAccess: () => void;
}

const firstAccessStorageKey = 'roleta:firstAccessStarted';

function persistFirstAccessFlag(value: boolean) {
    if (typeof window === 'undefined') return;

    if (value) {
        window.localStorage.setItem(firstAccessStorageKey, 'true');
        return;
    }

    window.localStorage.removeItem(firstAccessStorageKey);
}

function getInitialFirstAccessFlag() {
    if (typeof window === 'undefined') return false;

    return window.localStorage.getItem(firstAccessStorageKey) === 'true';
}

export const useRoletaGuestStore = create<RoletaGuestState>()(
    persist(
        (set) => ({
            isGuestFirstAccess: getInitialFirstAccessFlag(),
            hasGuestSpun: false,
            guestSpinToken: null,
            guestPrize: null,
            isLoginPromptOpen: false,
            pendingAuthAction: null,
            continueAsGuestFirstAccess: () => {
                persistFirstAccessFlag(true);
                set({
                    isGuestFirstAccess: true,
                    isLoginPromptOpen: false,
                    pendingAuthAction: null,
                });
            },
            requestLogin: (pendingAction = null) => set({
                isLoginPromptOpen: true,
                pendingAuthAction: pendingAction,
            }),
            closeLoginPrompt: () => set({ isLoginPromptOpen: false }),
            setGuestSpinResult: ({ token, prize }) => set({
                isGuestFirstAccess: true,
                hasGuestSpun: true,
                guestSpinToken: token,
                guestPrize: prize,
            }),
            clearGuestSpinToken: () => set({
                guestSpinToken: null,
                guestPrize: null,
            }),
            clearPendingAuthAction: () => set({ pendingAuthAction: null }),
            resetGuestAccess: () => {
                persistFirstAccessFlag(false);
                set({
                    isGuestFirstAccess: false,
                    hasGuestSpun: false,
                    guestSpinToken: null,
                    guestPrize: null,
                    isLoginPromptOpen: false,
                    pendingAuthAction: null,
                });
            },
        }),
        {
            name: 'roleta-guest-first-access-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: ({
                isGuestFirstAccess,
                hasGuestSpun,
                guestSpinToken,
                guestPrize,
            }) => ({
                isGuestFirstAccess,
                hasGuestSpun,
                guestSpinToken,
                guestPrize,
            }),
        },
    ),
);
