import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type ProdutoVitrine } from './useCartStore';
import { api } from '../utils/api';

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

interface ProdutoApi {
    id: number | string;
    nome: string;
    precoVenda: number | string;
    precoAntigo?: number | string | null;
    tamanho: string;
    imagemUrl?: string | null;
    curtidasCount: number;
    passosCount: number;
    nomesCurtidas?: string[] | null;
    categoria?: string | null;
}

interface ProdutosPage {
    content?: ProdutoApi[];
}

interface DiscoveryState {
    products: ProdutoVitrine[];
    isProductsLoading: boolean;
    productsError: string;
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
    fetchProducts: () => Promise<void>;
    removeProductFromStack: (id: string) => void;
    restoreProductToStack: (product: ProdutoVitrine) => void;
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

const apiBaseUrl = String(api.defaults.baseURL ?? '').replace(/\/$/, '');

function getImageUrl(imagePath?: string | null) {
    if (!imagePath) return undefined;
    if (/^https?:\/\//i.test(imagePath)) return imagePath;
    return `${apiBaseUrl}/${imagePath.replace(/^\/+/, '')}`;
}

function parsePrice(value?: number | string | null) {
    if (typeof value === 'number') return value;
    if (!value) return 0;

    const normalizedValue = value
        .replace(/[^\d,.-]/g, '')
        .replace(/\.(?=\d{3}(?:\D|$))/g, '')
        .replace(',', '.');

    return Number(normalizedValue) || 0;
}

function formatPrice(value: number) {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

function mapProduto(produto: ProdutoApi): ProdutoVitrine {
    const price = parsePrice(produto.precoVenda);
    const oldPrice = parsePrice(produto.precoAntigo);
    const imageUrl = getImageUrl(produto.imagemUrl);

    return {
        id: String(produto.id),
        name: produto.nome,
        price,
        category: produto.categoria?.trim() || 'Todas',
        iconId: 'shirt',
        sub: '',
        tamanho: produto.tamanho || 'Único',
        curtidasCount: produto.curtidasCount,
        passosCount: produto.passosCount,
        nomesCurtidas: produto.nomesCurtidas ?? [],
        curtidas: produto.curtidasCount,
        dislikes: produto.passosCount,
        images: imageUrl ? [imageUrl] : [],
        priceNew: formatPrice(price),
        priceOld: oldPrice > 0 ? formatPrice(oldPrice) : undefined,
    };
}

// Envolvemos a criação da store com o persist()
export const useDiscoveryStore = create<DiscoveryState>()(
    persist(
        (set, get) => ({
            products: [],
            isProductsLoading: true,
            productsError: '',
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

            fetchProducts: async () => {
                set({ isProductsLoading: true, productsError: '' });

                try {
                    const { data } = await api.get<ProdutoApi[] | ProdutosPage>('/admin/produtos');
                    const apiProducts = Array.isArray(data) ? data : data.content ?? [];
                    set({
                        products: apiProducts.map(mapProduto),
                        isProductsLoading: false,
                    });
                } catch {
                    set({
                        productsError: 'Não foi possível carregar as peças agora.',
                        isProductsLoading: false,
                    });
                }
            },

            removeProductFromStack: (id) => set((state) => ({
                products: state.products.filter((product) => product.id !== id),
            })),

            restoreProductToStack: (product) => set((state) => ({
                products: [
                    product,
                    ...state.products.filter((currentProduct) => (
                        currentProduct.id !== product.id
                    )),
                ],
            })),

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
