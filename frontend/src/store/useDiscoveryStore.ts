import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type ProdutoVitrine } from './useCartStore';
import { useAuthStore, type AuthUser } from './useAuthStore';
import { api } from '../utils/api';
import { apiRoutes } from '../utils/apiRoutes';
import { getImageUrl } from '../utils/imageUtils';

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

interface CurtidaApi {
    produto?: ProdutoApi | null;
    produtoId?: number | string;
}

interface CurtidasPage {
    content?: Array<CurtidaApi | ProdutoApi>;
}

interface DiscoveryState {
    products: ProdutoVitrine[];
    isLoading: boolean;
    error: string | null;
    isProductsLoading: boolean;
    productsError: string | null;
    isCurtidasLoading: boolean;
    curtidasError: string | null;
    likedItems: ProdutoVitrine[];
    history: string[];
    swipeDirections: SwipeDirection[];
    swipedCards: SwipedCard[];
    productReactionCounts: Record<string, ProductReactionCount>;
    pulseLikes: boolean;
    sessionLikes: number;
    matchAlertVisible: boolean;
    namePromptVisible: boolean;
    activeCategory: string;
    itemPrefs: Record<string, ItemPreference>;
    userName: string;

    setUserName: (name: string) => void;
    fetchProdutos: () => Promise<void>;
    fetchProducts: () => Promise<void>;
    fetchCurtidas: () => Promise<void>;
    removeProductFromStack: (id: string) => void;
    restoreProductToStack: (product: ProdutoVitrine) => void;
    triggerLikesPulse: () => void;
    dismissMatchAlert: () => void;
    dismissNamePrompt: () => void;
    setActiveCategory: (category: string) => void;
    swipeRight: (product: ProdutoVitrine) => void;
    swipeLeft: (product: ProdutoVitrine) => void;
    undoLastSwipe: () => ProdutoVitrine | null;
    setItemSize: (id: string, size: string) => void;
    toggleSelection: (id: string) => void;
    removeLikedItem: (id: string) => void;
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

function hasValidUserName(user: AuthUser | null) {
    const nome = typeof user?.nome === 'string' ? user.nome.trim() : '';
    const name = typeof user?.name === 'string' ? user.name.trim() : '';
    const telefone = typeof user?.telefone === 'string' ? user.telefone.trim() : '';
    const phone = typeof user?.phone === 'string' ? user.phone.trim() : '';
    const savedName = nome || name;
    const savedPhone = telefone || phone;

    return Boolean(savedName && savedName !== savedPhone);
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

function isProdutoApi(value: CurtidaApi | ProdutoApi): value is ProdutoApi {
    return 'nome' in value && 'precoVenda' in value;
}

function mapCurtida(item: CurtidaApi | ProdutoApi) {
    if (isProdutoApi(item)) return mapProduto(item);
    if (item.produto) return mapProduto(item.produto);
    return null;
}

// Envolvemos a criação da store com o persist()
export const useDiscoveryStore = create<DiscoveryState>()(
    persist(
        (set, get) => ({
            products: [],
            isLoading: false,
            error: null,
            isProductsLoading: false,
            productsError: null,
            isCurtidasLoading: false,
            curtidasError: null,
            likedItems: [],
            history: [],
            swipeDirections: [],
            swipedCards: [],
            productReactionCounts: {},
            pulseLikes: false,
            sessionLikes: 0,
            matchAlertVisible: false,
            namePromptVisible: false,
            activeCategory: 'TODAS AS PEÇAS',
            itemPrefs: {},
            userName: '',

            setUserName: (name) => set({ userName: name }),

            setActiveCategory: (category) => set({ activeCategory: category }),

            /**
             * Busca os produtos reais da API pública.
             * O loading é ativado antes da comunicação HTTP e sempre desligado
             * em `finally`; em caso de falha, a lista permanece vazia/atual e a
             * mensagem amigável fica em `error`/`productsError` para a UI renderizar.
             */
            fetchProdutos: async () => {
                set({
                    isLoading: true,
                    error: null,
                    isProductsLoading: true,
                    productsError: null,
                });

                try {
                    const { data } = await api.get<ProdutoApi[] | ProdutosPage>(
                        apiRoutes.produtos.list,
                    );
                    const apiProducts = Array.isArray(data) ? data : data.content ?? [];
                    set({
                        products: apiProducts.map(mapProduto),
                        isLoading: false,
                        isProductsLoading: false,
                    });
                } catch {
                    set({
                        error: 'Não foi possível carregar as peças agora.',
                        productsError: 'Não foi possível carregar as peças agora.',
                    });
                } finally {
                    set({
                        isLoading: false,
                        isProductsLoading: false,
                    });
                }
            },

            fetchProducts: async () => {
                await get().fetchProdutos();
            },

            /**
             * Busca as curtidas reais da API e substitui o estado local.
             * A ação aceita respostas paginadas ou listas simples; erros de rede
             * não criam dados artificiais, apenas atualizam `curtidasError` para
             * que a tela informe o usuário sem mascarar a falha da API.
             */
            fetchCurtidas: async () => {
                set({ isCurtidasLoading: true, curtidasError: null });

                try {
                    const { data } = await api.get<Array<CurtidaApi | ProdutoApi> | CurtidasPage>(
                        apiRoutes.curtidas.list,
                    );
                    const apiCurtidas = Array.isArray(data) ? data : data.content ?? [];
                    const likedItems = apiCurtidas
                        .map(mapCurtida)
                        .filter((item): item is ProdutoVitrine => Boolean(item));

                    set((state) => ({
                        likedItems,
                        itemPrefs: likedItems.reduce<Record<string, ItemPreference>>((prefs, item) => ({
                            ...prefs,
                            [item.id]: state.itemPrefs[item.id] ?? {
                                size: item.tamanho || 'M',
                                isSelected: true,
                            },
                        }), {}),
                        isCurtidasLoading: false,
                    }));
                } catch {
                    set({
                        curtidasError: 'Não foi possível carregar suas curtidas agora.',
                    });
                } finally {
                    set({ isCurtidasLoading: false });
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

            dismissNamePrompt: () => set({ namePromptVisible: false }),

            swipeRight: (product) => {
                const {
                    likedItems,
                    history,
                    itemPrefs,
                    sessionLikes,
                    matchAlertVisible,
                    namePromptVisible,
                    swipeDirections,
                    swipedCards,
                    productReactionCounts,
                    triggerLikesPulse,
                } = get();
                triggerLikesPulse();
                const alreadyLiked = likedItems.some(item => item.id === product.id);
                const nextSessionLikes = sessionLikes + 1;
                const shouldAskForName = nextSessionLikes === 3
                    && !hasValidUserName(useAuthStore.getState().user);
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
                    namePromptVisible: nextSessionLikes === 3 ? shouldAskForName : namePromptVisible,
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
                    namePromptVisible: lastDirection === 'like' && state.sessionLikes <= 3
                        ? false
                        : state.namePromptVisible,
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
            // Mantemos somente preferências leves em storage; produtos e curtidas
            // devem ser hidratados pela API para evitar dados antigos ou fictícios.
            partialize: (state) => ({
                activeCategory: state.activeCategory,
                userName: state.userName
            }),
            merge: (persistedState, currentState) => {
                const persisted = persistedState as Partial<DiscoveryState> | undefined;

                return {
                    ...currentState,
                    activeCategory: typeof persisted?.activeCategory === 'string'
                        ? persisted.activeCategory
                        : currentState.activeCategory,
                    userName: typeof persisted?.userName === 'string'
                        ? persisted.userName
                        : currentState.userName,
                };
            },
        }
    )
);
