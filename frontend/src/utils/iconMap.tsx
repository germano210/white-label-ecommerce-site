import { Shirt, ShoppingBag, Tag } from 'lucide-react';

/**
 * Mapeador de Ícones Vetoriais Premium
 * Transforma as strings do banco de dados em SVGs leves e escaláveis.
 */
export const getProductIcon = (iconId: string, size: number = 24) => {
    const iconProps = { size, strokeWidth: 1.2, className: "text-[#C2693F]" }; // Cor Terra padrão

    switch (iconId) {
        case 'shirt':
            return <Shirt {...iconProps} />;
        case 'pants':
        case 'skirt':
            return <Tag {...iconProps} />;
        case 'dress':
        case 'set':
        default:
            return <ShoppingBag {...iconProps} />;
    }
};