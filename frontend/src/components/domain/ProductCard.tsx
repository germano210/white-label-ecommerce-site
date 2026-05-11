import  {type ProdutoVitrine} from '../../store/useCartStore';

interface ProductCardProps {
    product: ProdutoVitrine;
    onViewDetails: (product: ProdutoVitrine) => void;
}

/**
 * ==========================================
 * COMPONENTE: PRODUCT CARD (A Vitrine)
 * ==========================================
 * Objetivo (CRO): Afunilar a atenção do cliente para a foto do produto e o preço.
 * O clique em qualquer lugar do card deve abrir o modal de detalhes (redução de atrito).
 */
export function ProductCard({ product, onViewDetails }: ProductCardProps) {
    return (
        <div
            className="group cursor-pointer flex flex-col gap-2"
            onClick={() => onViewDetails(product)}
            role="button"
            tabIndex={0}
            aria-label={`Ver detalhes de ${product.name}`}
        >
            {/* Container da Imagem: Aspect Ratio otimizado para moda (3:4) */}
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-gray-100">
                <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    loading="lazy" // Fundamental para performance (LCP)
                />

                {/* Gatilho Visual: Aparece apenas no hover em desktop, ou via toque longo no mobile */}
                <div className="absolute inset-0 bg-black/10 opacity-0 transition-opacity group-hover:opacity-100 flex items-end p-4">
          <span className="w-full bg-white/90 text-black text-center text-xs font-semibold uppercase tracking-wider py-2 backdrop-blur-sm shadow-sm">
            Ver Detalhes
          </span>
                </div>
            </div>

            {/* Informações de Preço (Fricção Zero: Leitura em "Z") */}
            <div className="flex flex-col mt-1">
                <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
                    {product.name}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                    {/* Formatador de Moeda Nativo do JS (Intl) - Mais leve que instalar libs extras */}
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                </p>
            </div>
        </div>
    );
}