import { useState } from 'react';
import {type ProdutoVitrine, useCartStore } from '../../store/useCartStore';

interface ProductModalProps {
    product: ProdutoVitrine | null;
    isOpen: boolean;
    onClose: () => void;
}

const SIZES = ['P', 'M', 'G', 'GG']; // Grade de tamanhos padrão

/**
 * ==========================================
 * COMPONENTE: MODAL DE PRODUTO (O Fecho da Venda)
 * ==========================================
 * @CRO Lei de Fitts: O botão de ação principal está fixo na base do ecrã (Thumb Zone).
 * @CRO Custo Cognitivo: Apenas mostramos os tamanhos e o botão. Sem distrações.
 */
export function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
    const [selectedSize, setSelectedSize] = useState<string>('');
    const addItem = useCartStore((state) => state.addItem);

    if (!isOpen || !product) return null;

    const handleAddToCart = () => {
        if (!selectedSize) return;
        addItem(product, selectedSize);
        onClose();
        setSelectedSize('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">

            {/* Container do Modal: Desliza da base no mobile, centrado no desktop */}
            <div className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">

                {/* Botão de Fechar Minimalista */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full text-gray-500 hover:text-black hover:bg-white transition-colors"
                    aria-label="Fechar detalhes"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="max-h-[85vh] overflow-y-auto pb-28">
                    {/* Imagem de Topo */}
                    <div className="aspect-[4/5] w-full bg-gray-100">
                        <img
                            src={product.iconId}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Dados Fatais: Nome e Preço */}
                    <div className="p-6">
                        <h2 className="text-xl font-semibold text-gray-900">{product.name}</h2>
                        <p className="text-lg text-gray-500 mt-1">
                            {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(product.price)}
                        </p>

                        {/* Seleção de Tamanhos (Afunilamento Cognitivo) */}
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-900 mb-3">Selecione o Tamanho</h3>
                            <div className="grid grid-cols-4 gap-3">
                                {SIZES.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        className={`py-3 text-sm font-medium rounded-lg border transition-all ${
                                            selectedSize === size
                                                ? 'border-black bg-black text-white'
                                                : 'border-gray-200 text-gray-700 hover:border-gray-900'
                                        }`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* =========================================================
            ZONA DE CONVERSÃO (Thumb Zone Fixa na Base)
            ========================================================= */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100">
                    <button
                        onClick={handleAddToCart}
                        disabled={!selectedSize}
                        className={`w-full py-4 rounded-xl font-bold text-base transition-all ${
                            selectedSize
                                ? 'bg-black text-white hover:bg-gray-800 transform active:scale-[0.98]'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {selectedSize ? 'Adicionar ao Carrinho' : 'Escolha um tamanho'}
                    </button>
                </div>

            </div>
        </div>
    );
}