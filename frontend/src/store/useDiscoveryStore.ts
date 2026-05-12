import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
    itemPrefs: Record<string, ItemPreference>;
    userName: string;

    setUserName: (name: string) => void;
    triggerLikesPulse: () => void;
    setActiveCategory: (category: string) => void;
    swipeRight: (product: ProdutoVitrine) => void;
    swipeLeft: (product: ProdutoVitrine) => void;
    undoLastSwipe: () => void;
    setItemSize: (id: string, size: string) => void;
    toggleSelection: (id: string) => void;
    removeLikedItem: (id: string) => void;
}

// Envolvemos a criação da store com o persist()
export const useDiscoveryStore = create<DiscoveryState>()(
    persist(
        (set, get) => ({
            likedItems: [],
            history: [],
            pulseLikes: false,
            activeCategory: 'TODAS AS PEÇAS',
            itemPrefs: {},
            userName: '',

            setUserName: (name) => set({ userName: name }),

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
        }),
        {
            name: 'viabras-storage', // Nome que ficará salvo no LocalStorage
            // O partialize escolhe o que deve ser salvo.
            // Ignoramos o pulseLikes para o botão não piscar sozinho ao atualizar a página.
            partialize: (state) => ({
                likedItems: state.likedItems,
                history: state.history,
                activeCategory: state.activeCategory,
                itemPrefs: state.itemPrefs,
                userName: state.userName
            }),
        }
    )
);