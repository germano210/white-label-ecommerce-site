import { create } from 'zustand';
import { type ProdutoVitrine } from './useCartStore';

interface ItemPreference {
    size: string;
    isSelected: boolean;
}

interface DiscoveryState {
    likedItems: ProdutoVitrine[];
    history: string[];

    pulseLikes: boolean;
    activeCategory: string;

    // NOVO: Guarda as escolhas do carrinho (tamanho e se está marcado)
    itemPrefs: Record<string, ItemPreference>;

    triggerLikesPulse: () => void;
    setActiveCategory: (category: string) => void;
    swipeRight: (product: ProdutoVitrine) => void;
    swipeLeft: (product: ProdutoVitrine) => void;
    undoLastSwipe: () => void;

    // Ações do Carrinho
    setItemSize: (id: string, size: string) => void;
    toggleSelection: (id: string) => void;
    removeLikedItem: (id: string) => void;
}

export const useDiscoveryStore = create<DiscoveryState>((set, get) => ({
    history: [],
    likedItems: [],
    pulseLikes: false,
    activeCategory: 'TODAS AS PEÇAS',
    itemPrefs: {},

    setActiveCategory: (category) => set({ activeCategory: category }),

    triggerLikesPulse: () => {
        set({ pulseLikes: true });
        setTimeout(() => set({ pulseLikes: false }), 800);
    },

    swipeRight: (product) => {
        const { likedItems, history, itemPrefs, triggerLikesPulse } = get();
        triggerLikesPulse();

        const alreadyLiked = likedItems.some(item => item.id === product.id);

        set({
            history: [...history, product.id],
            likedItems: alreadyLiked ? likedItems : [...likedItems, product],
            // Quando a peça entra, já vem selecionada e com tamanho 'M' por padrão
            itemPrefs: alreadyLiked ? itemPrefs : { ...itemPrefs, [product.id]: { size: 'M', isSelected: true } }
        });
    },

    swipeLeft: (product) => set((state) => ({
        history: [...state.history, product.id]
    })),

    undoLastSwipe: () => set((state) => {
        if (state.history.length === 0) return state;
        const newHistory = [...state.history];
        const lastId = newHistory.pop()!;
        const newLikedItems = state.likedItems.filter(item => item.id !== lastId);

        const newItemPrefs = { ...state.itemPrefs };
        delete newItemPrefs[lastId];

        return { history: newHistory, likedItems: newLikedItems, itemPrefs: newItemPrefs };
    }),

    // --- Lógica do Carrinho ---
    setItemSize: (id, size) => set((state) => ({
        itemPrefs: { ...state.itemPrefs, [id]: { ...state.itemPrefs[id], size } }
    })),

    toggleSelection: (id) => set((state) => ({
        itemPrefs: { ...state.itemPrefs, [id]: { ...state.itemPrefs[id], isSelected: !state.itemPrefs[id].isSelected } }
    })),

    removeLikedItem: (id) => set((state) => {
        const newItemPrefs = { ...state.itemPrefs };
        delete newItemPrefs[id];
        return {
            likedItems: state.likedItems.filter(item => item.id !== id),
            itemPrefs: newItemPrefs
        };
    })
}));