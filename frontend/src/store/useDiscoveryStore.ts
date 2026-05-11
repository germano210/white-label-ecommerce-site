import { create } from 'zustand';
import { type ProdutoVitrine } from './useCartStore';

interface DiscoveryState {
    // 1. O "Closet" da Cliente (Aba de Aprovados)
    likedItems: ProdutoVitrine[];

    // 2. O Histórico (Guarda os IDs para o Loop e para o botão "Desfazer")
    history: string[];

    // Mutações de Estado (Ações)
    swipeRight: (product: ProdutoVitrine) => void;
    swipeLeft: (product: ProdutoVitrine) => void;
    undoLastSwipe: () => void;
    resetDiscovery: () => void;
}

export const useDiscoveryStore = create<DiscoveryState>((set) => ({
    history: [],
    likedItems: [],

    swipeRight: (product) => set((state) => ({
        history: [...state.history, product.id],
        // Adicionamos uma trava de segurança: se a cliente der "Amei"
        // na mesma peça no 2º loop, ela não é duplicada no carrinho
        likedItems: state.likedItems.some(item => item.id === product.id)
            ? state.likedItems
            : [...state.likedItems, product]
    })),

    swipeLeft: (product) => set((state) => ({
        history: [...state.history, product.id]
    })),

    undoLastSwipe: () => set((state) => {
        if (state.history.length === 0) return state;

        const newHistory = [...state.history];
        const lastId = newHistory.pop(); // Remove o último ID arrastado

        // Remove dos itens curtidos caso ela tenha dado "Amei" sem querer
        const newLikedItems = state.likedItems.filter(item => item.id !== lastId);

        return { history: newHistory, likedItems: newLikedItems };
    }),

    // Limpa o histórico para recomeçar o Tinder Mode
    resetDiscovery: () => set({ history: [] })
}));