import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProdutoVitrine {
    id: string;
    name: string;
    price: number;
    category: string;
    iconId: string;
    sub: string;
    social?: string;
    tamanho: string;
    curtidasCount: number;
    passosCount: number;
    nomesCurtidas?: string[];
    curtidas?: number;
    dislikes?: number;
    images?: string[];
    priceNew: string;
    priceOld?: string;
    priceSave?: string;
    badge?: string;
    badgeText?: string;
}

export interface CartItem extends ProdutoVitrine {
    selectedSize: string;
    quantity: number;
}

interface CartState {
    items: CartItem[];
    addItem: (product: ProdutoVitrine, size: string) => void;
    removeItem: (productId: string, size: string) => void;
    incrementQuantity: (productId: string, size: string) => void;
    decrementQuantity: (productId: string, size: string) => void;
    clearCart: () => void;
    getTotal: () => number;
    getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (product, size) => {
                set((state) => {
                    const existingItemIndex = state.items.findIndex(
                        (item) => item.id === product.id && item.selectedSize === size,
                    );

                    if (existingItemIndex >= 0) {
                        const updatedItems = [...state.items];
                        updatedItems[existingItemIndex].quantity += 1;
                        return { items: updatedItems };
                    }

                    return {
                        items: [...state.items, { ...product, selectedSize: size, quantity: 1 }],
                    };
                });
            },

            removeItem: (productId, size) => {
                set((state) => ({
                    items: state.items.filter(
                        (item) => !(item.id === productId && item.selectedSize === size),
                    ),
                }));
            },

            incrementQuantity: (productId, size) => {
                set((state) => ({
                    items: state.items.map((item) =>
                        item.id === productId && item.selectedSize === size
                            ? { ...item, quantity: item.quantity + 1 }
                            : item,
                    ),
                }));
            },

            decrementQuantity: (productId, size) => {
                set((state) => {
                    const itemToDecrement = state.items.find(
                        (item) => item.id === productId && item.selectedSize === size,
                    );

                    if (itemToDecrement?.quantity === 1) {
                        return {
                            items: state.items.filter(
                                (item) => !(item.id === productId && item.selectedSize === size),
                            ),
                        };
                    }

                    return {
                        items: state.items.map((item) =>
                            item.id === productId && item.selectedSize === size
                                ? { ...item, quantity: item.quantity - 1 }
                                : item,
                        ),
                    };
                });
            },

            clearCart: () => set({ items: [] }),

            getTotal: () => get().items.reduce((total, item) => total + item.price * item.quantity, 0),

            getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
        }),
        {
            name: 'lili-moda-cart-storage',
        },
    ),
);
