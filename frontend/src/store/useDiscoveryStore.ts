import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type ProdutoVitrine } from './useCartStore'; // Aproveitamos o contrato já existente

/**
 * ============================================================================
 * ENGINE DE DESCOBERTA (O "Modo Tinder")
 * ============================================================================
 * Módulo responsável por gerir o ciclo dopaminérgico de gamificação da loja.
 * Persiste as escolhas binárias da cliente (Gosto/Não Gosto) sem exigir login,
 * reduzindo a Fricção Zero e a Fadiga de Decisão (Lei de Hick).
 */

interface SwipeAction {
    product: ProdutoVitrine;
    type: 'like' | 'dislike';
}

interface DiscoveryState {
    // 1. O "Closet" da Cliente (Aba de Aprovados)
    likedItems: ProdutoVitrine[];

    // 2. O Lixo Cognitivo (Não mostrar novamente)
    dislikedIds: string[];

    // 3. O Histórico (Para o botão "Desfazer / Voltar")
    history: SwipeAction[];

    // Mutações de Estado (Ações)
    swipeRight: (product: ProdutoVitrine) => void;
    swipeLeft: (product: ProdutoVitrine) => void;
    undoLastSwipe: () => void;
    clearDiscoverySession: () => void;
}

export const useDiscoveryStore = create<DiscoveryState>()(
    persist(
        (set) => ({
            likedItems: [],
            dislikedIds: [],
            history: [],

            /**
             * SWIPE RIGHT (Coração / Aprovado)
             * Salva o produto inteiro para a aba de aprovados e regista no histórico.
             */
            swipeRight: (product) => {
                set((state) => {
                    // Prevenção de duplicados caso o motor tente enviar o mesmo produto duas vezes
                    const isAlreadyLiked = state.likedItems.some(item => item.id === product.id);

                    return {
                        likedItems: isAlreadyLiked ? state.likedItems : [...state.likedItems, product],
                        history: [...state.history, { product, type: 'like' }],
                    };
                });
            },

            /**
             * SWIPE LEFT (Rejeitado)
             * Salva apenas o ID (não precisamos dos dados completos de algo rejeitado, poupando memória).
             */
            swipeLeft: (product) => {
                set((state) => {
                    const isAlreadyDisliked = state.dislikedIds.includes(product.id);

                    return {
                        dislikedIds: isAlreadyDisliked ? state.dislikedIds : [...state.dislikedIds, product.id],
                        history: [...state.history, { product, type: 'dislike' }],
                    };
                });
            },

            /**
             * UNDO (Desfazer / Botão Voltar)
             * @CRO Reduz a ansiedade de decisão. Se a cliente rejeitar sem querer uma peça que gostou,
             * ela pode reverter. A função retira a última ação da pilha e limpa a consequência.
             */
            undoLastSwipe: () => {
                set((state) => {
                    if (state.history.length === 0) return state; // Nada para desfazer

                    const newHistory = [...state.history];
                    const lastAction = newHistory.pop(); // Remove o último item do histórico

                    if (!lastAction) return state;

                    // Se a última ação foi um "Like", removemos dos "Aprovados"
                    if (lastAction.type === 'like') {
                        return {
                            history: newHistory,
                            likedItems: state.likedItems.filter(item => item.id !== lastAction.product.id),
                        };
                    }

                    // Se a última ação foi um "Dislike", removemos dos "Rejeitados"
                    return {
                        history: newHistory,
                        dislikedIds: state.dislikedIds.filter(id => id !== lastAction.product.id),
                    };
                });
            },

            /**
             * Limpa a sessão (útil para quando o pedido for concluído ou para reset de testes)
             */
            clearDiscoverySession: () => set({ likedItems: [], dislikedIds: [], history: [] }),
        }),
        {
            // Persistência: A cliente pode voltar amanhã e a sua lista de "Aprovados" continua lá.
            name: 'lili-moda-discovery-storage',
        }
    )
);