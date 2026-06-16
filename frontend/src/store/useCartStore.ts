import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * ============================================================================
 * ENGINE DE CARRINHO: MOTOR DE RETENÇÃO E FRICÇÃO ZERO
 * ============================================================================
 * Este módulo gerencia o estado global do carrinho de compras.
 * Projetado sob os princípios de Otimização de Conversão (CRO) e
 * Psicologia Cognitiva (Lei de Hick), ele minimiza o abandono de carrinho
 * através da persistência local e do agrupamento inteligente de SKUs.
 */

// ----------------------------------------------------------------------------
// 1. CONTRATOS DE DADOS (DOMÍNIO)
// ----------------------------------------------------------------------------

export interface ProdutoVitrine {
    id: string;
    name: string;
    price: number;        // Valor numérico para cálculos de checkout
    category: string;
    iconId: string;        // Representação visual simplificada (Ícone)
    sub: string;          // Subtítulo descritivo (ex: "Linho · Off white")
    social?: string;       // Prova social (ex: "👁 23 pessoas viram agora")
    tamanho: string;
    curtidasCount: number;
    passosCount: number;
    nomesCurtidas?: string[];
    curtidas?: number;
    dislikes?: number;
    images?: string[];

    // Propriedades de Display (Opcionais para flexibilidade do catálogo)
    priceNew: string;     // String formatada para exibição (ex: "R$129")
    priceOld?: string;    // Preço de comparação para ancoragem
    priceSave?: string;   // Texto de destaque de economia
    badge?: string;       // Classe CSS do selo (ex: 'escasso', 'hot', 'novo')
    badgeText?: string;   // Texto interno do selo
}

/**
 * Representa um SKU (Stock Keeping Unit) ativo no carrinho.
 * Separa a entidade "Produto" da "Variação Escolhida" para facilitar
 * a futura integração com o ERP/Gestão de Estoque no Spring Boot.
 */
export interface CartItem extends ProdutoVitrine {
    selectedSize: string;
    quantity: number;
}

interface CartState {
    items: CartItem[];

    // Ações de Usuário (Mutações de Estado)
    addItem: (product: ProdutoVitrine, size: string) => void;
    removeItem: (productId: string, size: string) => void;
    incrementQuantity: (productId: string, size: string) => void;
    decrementQuantity: (productId: string, size: string) => void;
    clearCart: () => void;

    // Computed Values (Lógica de Negócio e Conversão)
    getTotal: () => number;
    getTotalItems: () => number;
    getWhatsappLink: () => string;
}

// ----------------------------------------------------------------------------
// 2. IMPLEMENTAÇÃO DO ESTADO GLOBAL
// ----------------------------------------------------------------------------

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            /**
             * Adiciona um item à sacola com inteligência de agrupamento.
             * @UX Aplicação da Lei de Hick: Se o cliente clica múltiplas vezes no mesmo
             * tamanho, o sistema não polui a tela com novas linhas. Ele agrupa silenciosamente,
             * reduzindo a carga visual no momento do checkout.
             */
            addItem: (product, size) => {
                set((state) => {
                    const existingItemIndex = state.items.findIndex(
                        (item) => item.id === product.id && item.selectedSize === size
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

            /**
             * Exclui cirurgicamente uma variação inteira do carrinho.
             */
            removeItem: (productId, size) => {
                set((state) => ({
                    items: state.items.filter(
                        (item) => !(item.id === productId && item.selectedSize === size)
                    ),
                }));
            },

            incrementQuantity: (productId, size) => {
                set((state) => ({
                    items: state.items.map((item) =>
                        item.id === productId && item.selectedSize === size
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    ),
                }));
            },

            /**
             * Reduz a quantidade. Remove o item automaticamente se chegar a zero,
             * mantendo o carrinho limpo de "itens vazios" que geram dúvidas.
             */
            decrementQuantity: (productId, size) => {
                set((state) => {
                    const itemToDecrement = state.items.find(
                        (item) => item.id === productId && item.selectedSize === size
                    );

                    if (itemToDecrement?.quantity === 1) {
                        return {
                            items: state.items.filter(
                                (item) => !(item.id === productId && item.selectedSize === size)
                            ),
                        };
                    }

                    return {
                        items: state.items.map((item) =>
                            item.id === productId && item.selectedSize === size
                                ? { ...item, quantity: item.quantity - 1 }
                                : item
                        ),
                    };
                });
            },

            /**
             * Disparado após a confirmação do pedido para iniciar um novo ciclo de LTV.
             */
            clearCart: () => set({ items: [] }),

            // ----------------------------------------------------------------------
            // 3. ENGINE DE CÁLCULO E CONVERSÃO
            // ----------------------------------------------------------------------

            getTotal: () => {
                return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
            },

            getTotalItems: () => {
                return get().items.reduce((total, item) => total + item.quantity, 0);
            },

            /**
             * Checkout Conversacional (One-Click to WhatsApp)
             * @Strategy Transforma o carrinho complexo em um payload de texto limpo.
             * Reduz drasticamente o Custo Cognitivo (Tc ≈ 0), pois a cliente não
             * precisa preencher formulários extensos. A venda cai pronta para a loja.
             */
            getWhatsappLink: () => {
                const { items, getTotal } = get();
                if (items.length === 0) return '';

                let message = "🛍️ *Novo Pedido - Lili Moda*\n\nOlá! Gostaria de finalizar a compra dos seguintes itens:\n\n";

                items.forEach((item) => {
                    message += `▪️ ${item.quantity}x ${item.name} (Tamanho: ${item.selectedSize})\n   Valor: R$ ${(item.price * item.quantity).toFixed(2)}\n`;
                });

                message += `\n💰 *Total do Pedido: R$ ${getTotal().toFixed(2)}*\n\nPor favor, me informe sobre as opções de pagamento e entrega.`;

                // TODO: Mover o telefone para uma variável de ambiente (VITE_WHATSAPP_NUMBER) no futuro para White-Label.
                const phoneNumber = "5551999999999";
                return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
            },
        }),
        {
            // Persistência Anti-Abandono: Garante que os dados sobrevivam a fechamentos acidentais da aba.
            name: 'lili-moda-cart-storage',
        }
    )
);
