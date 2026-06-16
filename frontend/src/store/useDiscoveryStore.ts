import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type ProdutoVitrine } from './useCartStore';

interface ItemPreference {
    size: string;
    isSelected: boolean;
}

type SwipeDirection = 'like' | 'dislike';

interface ProductReactionCount {
    likes: number;
    dislikes: number;
}

interface SwipedCard {
    product: ProdutoVitrine;
    direction: SwipeDirection;
}

interface DiscoveryState {
    likedItems: ProdutoVitrine[];
    history: string[];
    swipeDirections: SwipeDirection[];
    swipedCards: SwipedCard[];
    productReactionCounts: Record<string, ProductReactionCount>;
    pulseLikes: boolean;
    sessionLikes: number;
    matchAlertVisible: boolean;
    activeCategory: string;
    itemPrefs: Record<string, ItemPreference>;
    userName: string;

    setUserName: (name: string) => void;
    triggerLikesPulse: () => void;
    dismissMatchAlert: () => void;
    setActiveCategory: (category: string) => void;
    swipeRight: (product: ProdutoVitrine) => void;
    swipeLeft: (product: ProdutoVitrine) => void;
    undoLastSwipe: () => ProdutoVitrine | null;
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
            swipeDirections: [],
            swipedCards: [],
            productReactionCounts: {},
            pulseLikes: false,
            sessionLikes: 0,
            matchAlertVisible: false,
            activeCategory: 'TODAS AS PEÇAS',
            itemPrefs: {},
            userName: '',

            setUserName: (name) => set({ userName: name }),

            setActiveCategory: (category) => set({ activeCategory: category }),

            triggerLikesPulse: () => {
                set({ pulseLikes: true });
                setTimeout(() => set({ pulseLikes: false }), 800);
            },

            dismissMatchAlert: () => set({ matchAlertVisible: false }),

            swipeRight: (product) => {
                const {
                    likedItems,
                    history,
                    itemPrefs,
                    sessionLikes,
                    matchAlertVisible,
                    swipeDirections,
                    swipedCards,
                    productReactionCounts,
                    triggerLikesPulse,
                } = get();
                triggerLikesPulse();
                const alreadyLiked = likedItems.some(item => item.id === product.id);
                const nextSessionLikes = sessionLikes + 1;
                const currentCounts = productReactionCounts[product.id] ?? {
                    likes: product.curtidasCount,
                    dislikes: product.passosCount,
                };

                set({
                    history: [...history, product.id],
                    swipeDirections: [...swipeDirections, 'like'],
                    swipedCards: [...swipedCards, { product, direction: 'like' }],
                    productReactionCounts: {
                        ...productReactionCounts,
                        [product.id]: {
                            ...currentCounts,
                            likes: currentCounts.likes + 1,
                        },
                    },
                    likedItems: alreadyLiked ? likedItems : [...likedItems, product],
                    itemPrefs: alreadyLiked ? itemPrefs : {
                        ...itemPrefs,
                        [product.id]: { size: product.tamanho || 'M', isSelected: true },
                    },
                    sessionLikes: nextSessionLikes,
                    matchAlertVisible: nextSessionLikes === 3 ? true : matchAlertVisible,
                });
            },

            swipeLeft: (product) => set((state) => ({
                history: [...state.history, product.id],
                swipeDirections: [...state.swipeDirections, 'dislike'],
                swipedCards: [...state.swipedCards, { product, direction: 'dislike' }],
                productReactionCounts: {
                    ...state.productReactionCounts,
                    [product.id]: {
                        ...(state.productReactionCounts[product.id] ?? {
                            likes: product.curtidasCount,
                            dislikes: product.passosCount,
                        }),
                        dislikes: (
                            state.productReactionCounts[product.id]?.dislikes
                            ?? product.passosCount
                        ) + 1,
                    },
                },
            })),

            undoLastSwipe: () => {
                const state = get();
                const lastSwipe = state.swipedCards.at(-1);
                if (!lastSwipe) return null;

                const newHistory = [...state.history];
                newHistory.pop();
                const newSwipeDirections = [...state.swipeDirections];
                newSwipeDirections.pop();
                const newSwipedCards = [...state.swipedCards];
                newSwipedCards.pop();
                const newProductReactionCounts = { ...state.productReactionCounts };
                const lastId = lastSwipe.product.id;
                const lastDirection = lastSwipe.direction;
                const lastProductCounts = newProductReactionCounts[lastId];
                const newLikedItems = lastDirection === 'like'
                    ? state.likedItems.filter(item => item.id !== lastId)
                    : state.likedItems;
                const newItemPrefs = { ...state.itemPrefs };
                if (lastDirection === 'like') delete newItemPrefs[lastId];

                if (lastProductCounts && lastDirection) {
                    newProductReactionCounts[lastId] = {
                        ...lastProductCounts,
                        likes: lastDirection === 'like'
                            ? Math.max(lastProductCounts.likes - 1, 0)
                            : lastProductCounts.likes,
                        dislikes: lastDirection === 'dislike'
                            ? Math.max(lastProductCounts.dislikes - 1, 0)
                            : lastProductCounts.dislikes,
                    };
                }

                set({
                    history: newHistory,
                    swipeDirections: newSwipeDirections,
                    swipedCards: newSwipedCards,
                    productReactionCounts: newProductReactionCounts,
                    likedItems: newLikedItems,
                    itemPrefs: newItemPrefs,
                    sessionLikes: lastDirection === 'like'
                        ? Math.max(state.sessionLikes - 1, 0)
                        : state.sessionLikes,
                    matchAlertVisible: lastDirection === 'like'
                        ? false
                        : state.matchAlertVisible,
                });

                return lastSwipe.product;
            },

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
                swipeDirections: state.swipeDirections,
                swipedCards: state.swipedCards,
                productReactionCounts: state.productReactionCounts,
                activeCategory: state.activeCategory,
                itemPrefs: state.itemPrefs,
                userName: state.userName
            }),
        }
    )
);
