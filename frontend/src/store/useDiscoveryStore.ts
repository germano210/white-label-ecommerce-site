import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type ProdutoVitrine } from './useCartStore';
import { useAuthStore, type AuthUser } from './useAuthStore';
import { api } from '../utils/api';
import { apiRoutes } from '../utils/apiRoutes';
import { getImageUrl } from '../utils/imageUtils';
import { parseCondicao } from '../utils/condicao';

interface ItemPreference {
    size: string;
    isSelected: boolean;
}

type SwipeDirection = 'like' | 'dislike';
export type CurtidasMode = 'lista' | 'resgate';

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
    imagens?: ProdutoImagemApi[] | null;
    curtidasCount: number;
    passosCount: number;
    nomesCurtidas?: string[] | null;
    categoria?: string | null;
    condicao?: number | string | null;
    condicaoRoupa?: number | string | null;
    condicao_roupa?: number | string | null;
    comprado?: boolean | number | string | null;
    resgatado?: boolean | number | string | null;
    compraConcluida?: boolean | number | string | null;
    pagamentoConfirmado?: boolean | number | string | null;
    status?: string | null;
    statusCompra?: string | null;
    pedidoStatus?: string | null;
}

type ProdutoImagemApi = string | {
    id?: number | string | null;
    url?: string | null;
    imagemUrl?: string | null;
    caminho?: string | null;
    path?: string | null;
    principal?: boolean | null;
    ordem?: number | string | null;
};

interface ProdutosPage {
    content?: ProdutoApi[];
}

interface CurtidaApi {
    produto?: ProdutoApi | null;
    produtoId?: number | string;
    imagemUrl?: string | null;
    imagens?: ProdutoImagemApi[] | null;
    comprado?: boolean | number | string | null;
    resgatado?: boolean | number | string | null;
    compraConcluida?: boolean | number | string | null;
    pagamentoConfirmado?: boolean | number | string | null;
    status?: string | null;
    statusCompra?: string | null;
    pedidoStatus?: string | null;
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
    curtidasMode: CurtidasMode;
    itemPrefs: Record<string, ItemPreference>;
    userName: string;

    setUserName: (name: string) => void;
    fetchProdutos: () => Promise<void>;
    fetchProducts: () => Promise<void>;
    fetchCurtidas: () => Promise<void>;
    removeProductFromStack: (id: string) => void;
    restoreProductToStack: (product: ProdutoVitrine) => void;
    syncProductReactionCount: (
        productId: string,
        counts: Partial<ProductReactionCount>,
    ) => void;
    triggerLikesPulse: () => void;
    dismissMatchAlert: () => void;
    dismissNamePrompt: () => void;
    setActiveCategory: (category: string) => void;
    setCurtidasMode: (mode: CurtidasMode) => void;
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

function getProdutoImagePath(image: ProdutoImagemApi) {
    if (typeof image === 'string') return image;
    return image.url ?? image.imagemUrl ?? image.caminho ?? image.path ?? '';
}

function isPrincipalImage(value: unknown) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
    return false;
}

function getProdutoImageCollections(produto: ProdutoApi) {
    const imageEntries = (produto.imagens ?? [])
        .map((image, index) => ({
            path: getProdutoImagePath(image),
            principal: typeof image === 'object' && image !== null
                ? isPrincipalImage(image.principal)
                : false,
            ordem: typeof image === 'object' && image !== null ? Number(image.ordem ?? index) : index,
        }))
        .filter((image) => image.path.trim().length > 0)
        .sort((a, b) => {
            if (a.principal !== b.principal) return a.principal ? -1 : 1;
            return a.ordem - b.ordem;
        });

    const hasExplicitPrincipal = imageEntries.some((image) => image.principal);
    const orderedPaths = imageEntries.map((image) => image.path);
    const fallbackPath = produto.imagemUrl?.trim();
    const paths = (() => {
        if (!fallbackPath) return orderedPaths;
        if (orderedPaths.length === 0) return [fallbackPath];
        if (!hasExplicitPrincipal) {
            return [fallbackPath, ...orderedPaths.filter((path) => path !== fallbackPath)];
        }
        if (orderedPaths.includes(fallbackPath)) return orderedPaths;

        return [...orderedPaths, fallbackPath];
    })();
    const secondaryPaths = (() => {
        if (imageEntries.length === 0) return [];
        if (hasExplicitPrincipal) {
            return imageEntries
                .filter((image) => !image.principal)
                .map((image) => image.path);
        }
        if (!fallbackPath) return orderedPaths.slice(1);

        return orderedPaths.filter((path) => path !== fallbackPath);
    })();

    return {
        allImages: Array.from(new Set(paths)).map((path) => getImageUrl(path)),
        secondaryImages: Array.from(new Set(secondaryPaths)).map((path) => getImageUrl(path)),
    };
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

function readApiBoolean(value: boolean | number | string | null | undefined) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const normalizedValue = value.trim().toLowerCase();
        return ['true', '1', 'sim', 'yes'].includes(normalizedValue);
    }

    return false;
}

function readPurchaseStatus(produto: ProdutoApi) {
    return produto.statusCompra ?? produto.pedidoStatus ?? produto.status ?? '';
}

function isPurchasedProduto(produto: ProdutoApi) {
    if (
        readApiBoolean(produto.comprado)
        || readApiBoolean(produto.resgatado)
        || readApiBoolean(produto.compraConcluida)
        || readApiBoolean(produto.pagamentoConfirmado)
    ) {
        return true;
    }

    const normalizedStatus = readPurchaseStatus(produto)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toUpperCase();

    return [
        'PAGO',
        'PAGA',
        'APROVADO',
        'APROVADA',
        'CONFIRMADO',
        'CONFIRMADA',
        'CONCLUIDO',
        'CONCLUIDA',
        'COMPRADO',
        'COMPRADA',
        'RESGATADO',
        'RESGATADA',
        'PAGAMENTO_APROVADO',
        'PAGAMENTO_CONFIRMADO',
        'FINALIZADO',
        'FINALIZADA',
        'ENTREGUE',
        'ENVIADO',
        'PAID',
        'APPROVED',
        'CONFIRMED',
        'COMPLETED',
        'REDEEMED',
    ].includes(normalizedStatus);
}

function mapProduto(produto: ProdutoApi): ProdutoVitrine {
    const price = parsePrice(produto.precoVenda);
    const oldPrice = parsePrice(produto.precoAntigo);
    const { allImages, secondaryImages } = getProdutoImageCollections(produto);

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
        images: allImages,
        secondaryImages,
        condicao: parseCondicao(produto.condicao ?? produto.condicaoRoupa ?? produto.condicao_roupa),
        priceNew: formatPrice(price),
        priceOld: oldPrice > 0 ? formatPrice(oldPrice) : undefined,
        comprado: isPurchasedProduto(produto),
        resgatado: readApiBoolean(produto.resgatado),
        statusCompra: readPurchaseStatus(produto),
    };
}

function shuffleProducts(products: ProdutoVitrine[]): ProdutoVitrine[] {
    const shuffledProducts = [...products];

    for (let index = shuffledProducts.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffledProducts[index], shuffledProducts[swapIndex]] = [
            shuffledProducts[swapIndex],
            shuffledProducts[index],
        ];
    }

    return shuffledProducts;
}

function isProdutoApi(value: CurtidaApi | ProdutoApi): value is ProdutoApi {
    return 'nome' in value && 'precoVenda' in value;
}

function mapCurtida(item: CurtidaApi | ProdutoApi) {
    if (isProdutoApi(item)) return mapProduto(item);
    if (item.produto) {
        return mapProduto({
            ...item.produto,
            imagemUrl: item.produto.imagemUrl ?? item.imagemUrl,
            imagens: item.produto.imagens ?? item.imagens,
            comprado: item.produto.comprado ?? item.comprado,
            resgatado: item.produto.resgatado ?? item.resgatado,
            compraConcluida: item.produto.compraConcluida ?? item.compraConcluida,
            pagamentoConfirmado: item.produto.pagamentoConfirmado ?? item.pagamentoConfirmado,
            status: item.produto.status ?? item.status,
            statusCompra: item.produto.statusCompra ?? item.statusCompra,
            pedidoStatus: item.produto.pedidoStatus ?? item.pedidoStatus,
        });
    }
    return null;
}

function clampReactionCount(value: number | undefined) {
    return Math.max(Math.floor(value ?? 0), 0);
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
            curtidasMode: 'lista',
            itemPrefs: {},
            userName: '',

            setUserName: (name) => set({ userName: name }),

            setActiveCategory: (category) => set({ activeCategory: category }),

            setCurtidasMode: (mode) => set({ curtidasMode: mode }),

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
                    const shuffledProducts = shuffleProducts(apiProducts.map(mapProduto));

                    set({
                        products: shuffledProducts,
                        productReactionCounts: {},
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

            syncProductReactionCount: (productId, counts) => set((state) => {
                const product = state.products.find((item) => item.id === productId)
                    ?? state.likedItems.find((item) => item.id === productId)
                    ?? state.swipedCards.find((item) => item.product.id === productId)?.product;
                const currentCounts = state.productReactionCounts[productId] ?? {
                    likes: product?.curtidasCount ?? 0,
                    dislikes: product?.passosCount ?? 0,
                };
                const nextCounts = {
                    likes: clampReactionCount(counts.likes ?? currentCounts.likes),
                    dislikes: clampReactionCount(counts.dislikes ?? currentCounts.dislikes),
                };
                const syncProduct = (item: ProdutoVitrine): ProdutoVitrine => {
                    if (item.id !== productId) return item;

                    return {
                        ...item,
                        curtidasCount: nextCounts.likes,
                        passosCount: nextCounts.dislikes,
                        curtidas: nextCounts.likes,
                        dislikes: nextCounts.dislikes,
                    };
                };

                return {
                    products: state.products.map(syncProduct),
                    likedItems: state.likedItems.map(syncProduct),
                    swipedCards: state.swipedCards.map((item) => ({
                        ...item,
                        product: syncProduct(item.product),
                    })),
                    productReactionCounts: {
                        ...state.productReactionCounts,
                        [productId]: nextCounts,
                    },
                };
            }),

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
                        dislikes: lastProductCounts.dislikes,
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
                curtidasMode: state.curtidasMode,
                userName: state.userName
            }),
            merge: (persistedState, currentState) => {
                const persisted = persistedState as Partial<DiscoveryState> | undefined;

                return {
                    ...currentState,
                    activeCategory: typeof persisted?.activeCategory === 'string'
                        ? persisted.activeCategory
                        : currentState.activeCategory,
                    curtidasMode: persisted?.curtidasMode === 'resgate'
                        ? 'resgate'
                        : currentState.curtidasMode,
                    userName: typeof persisted?.userName === 'string'
                        ? persisted.userName
                        : currentState.userName,
                };
            },
        }
    )
);
