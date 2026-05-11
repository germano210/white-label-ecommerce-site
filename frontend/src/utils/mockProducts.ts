import { type ProdutoVitrine } from '../store/useCartStore';

export const mockProducts: ProdutoVitrine[] = [
    { id: '1', name: 'Blusa Siena', category: 'Blusas', price: 129.00, emoji: '👗', badge: 'escasso', badgeText: '⚡ Últimas 2', priceOld: 'R$189', priceNew: 'R$129', priceSave: 'Economize R$60', social: '👁 23 pessoas viram agora', sub: 'Linho · Off white · P M G' },
    { id: '2', name: 'Calça Palazzo', category: 'Calças', price: 179.00, emoji: '👖', badge: 'hot', badgeText: '🔥 Mais vendido', priceOld: 'R$249', priceNew: 'R$179', priceSave: 'Economize R$70', social: '❤️ 41 pessoas salvaram', sub: 'Crepe · Preto · P M G GG' },
    { id: '3', name: 'Vestido Terra', category: 'Vestidos', price: 219.00, emoji: '👗', badge: 'novo', badgeText: '✨ Novo', priceOld: '', priceNew: 'R$219', priceSave: '', social: '📸 18 clientes já postaram', sub: 'Viscose · Terracota · P M G' },
    { id: '4', name: 'Blazer Milano', category: 'Casacos', price: 299.00, emoji: '🧥', badge: '', badgeText: '', priceOld: 'R$399', priceNew: 'R$299', priceSave: '-25%', social: '💼 Ideal para trabalho', sub: 'Alfaiataria · Caramelo · P M G' },
    { id: '5', name: 'Saia Midi Liz', category: 'Saias', price: 119.00, emoji: '👗', badge: 'escasso', badgeText: '⚡ Última unidade', priceOld: 'R$169', priceNew: 'R$119', priceSave: 'Economize R$50', social: '⚠️ Quase esgotado!', sub: 'Cetim · Nude · M G' },
    { id: '6', name: 'Conjunto Roma', category: 'Conjuntos', price: 289.00, emoji: '👚', badge: 'novo', badgeText: '✨ Novo', priceOld: '', priceNew: 'R$289', priceSave: '', social: '🌟 Mais comentado do mês', sub: 'Linho · Branco · P M G GG' },
];