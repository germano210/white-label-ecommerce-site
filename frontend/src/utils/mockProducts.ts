
// Adicionamos a tipagem 'any' temporariamente para aceitar o array de imagens
// sem precisar reescrever as suas interfaces principais.
export const mockProducts: any[] = [
    {
        id: '1', name: 'Blusa Mula Manca', category: 'Blusas', price: 79.90, iconId: 'shirt', badge: 'hot', badgeText: '🔥 Mais likes', priceOld: 'R$119,90', priceNew: 'R$79,90', sub: 'Canelado · Verde Mint · P M G',
        images: [
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
            'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
            'https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=800&q=80'
        ]
    },
    {
        id: '2', name: 'Calça Wide Leg', category: 'Calças', price: 159.90, iconId: 'pants', badge: 'novo', badgeText: '✨ Novo', priceOld: 'R$199,90', priceNew: 'R$159,90', sub: 'Jeans 100% Algodão · Lavagem Clara',
        images: [
            'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80',
            'https://images.unsplash.com/photo-1584328627389-4f70742cd26e?w=800&q=80',
            'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80'
        ]
    },
    {
        id: '3', name: 'Vestido Seda Flora', category: 'Vestidos', price: 219.00, iconId: 'dress', badge: '', badgeText: '', priceOld: '', priceNew: 'R$219,00', sub: 'Toque de Seda · Estampa Floral · M G',
        images: [
            'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80',
            'https://images.unsplash.com/photo-1515347619252-1bf7ebbc1723?w=800&q=80',
            'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80'
        ]
    },
    {
        id: '4', name: 'Blazer Alfaiataria', category: 'Casacos', price: 289.00, iconId: 'shirt', badge: 'escasso', badgeText: '⚡ Últimas 2', priceOld: 'R$359,00', priceNew: 'R$289,00', sub: 'Alfaiataria Premium · Preto · P M',
        images: [
            'https://images.unsplash.com/photo-1550614000-4b9a9d701a2e?w=800&q=80',
            'https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=800&q=80',
            'https://images.unsplash.com/photo-1550614000-4b9a9d701a2e?w=800&q=80'
        ]
    },
    {
        id: '5', name: 'Saia Plissada Areia', category: 'Saias', price: 119.90, iconId: 'skirt', badge: '', badgeText: '', priceOld: 'R$149,90', priceNew: 'R$119,90', sub: 'Crepe Leve · Nude · Cintura Alta',
        images: [
            'https://images.unsplash.com/photo-1583496661160-c5d014f9714d?w=800&q=80',
            'https://images.unsplash.com/photo-1583496661160-c5d014f9714d?w=800&q=80',
            'https://images.unsplash.com/photo-1583496661160-c5d014f9714d?w=800&q=80'
        ]
    },
    {
        id: '6', name: 'Conjunto Moletinho', category: 'Conjuntos', price: 189.90, iconId: 'set', badge: 'novo', badgeText: '✨ Novo', priceOld: '', priceNew: 'R$189,90', sub: 'Moletom Premium · Cinza Mescla',
        images: [
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
            'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80'
        ]
    },
    {
        id: '7', name: 'Body Renda Noir', category: 'Blusas', price: 89.90, iconId: 'shirt', badge: 'hot', badgeText: '🔥 Tendência', priceOld: 'R$129,90', priceNew: 'R$89,90', sub: 'Renda com Elastano · Preto · P M G',
        images: [
            'https://images.unsplash.com/photo-1434389678392-f0b472f616e1?w=800&q=80',
            'https://images.unsplash.com/photo-1434389678392-f0b472f616e1?w=800&q=80',
            'https://images.unsplash.com/photo-1434389678392-f0b472f616e1?w=800&q=80'
        ]
    },
    {
        id: '8', name: 'Shorts Linho Cru', category: 'Calças', price: 99.90, iconId: 'pants', badge: 'escasso', badgeText: '⚡ Última Peça', priceOld: 'R$139,90', priceNew: 'R$99,90', sub: 'Linho Puro · Cru · Tamanho M',
        images: [
            'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=800&q=80',
            'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=800&q=80',
            'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=800&q=80'
        ]
    },
    {
        id: '9', name: 'Macacão Pantalona', category: 'Conjuntos', price: 259.90, iconId: 'set', badge: '', badgeText: '', priceOld: 'R$299,90', priceNew: 'R$259,90', sub: 'Viscolinho · Terracota · P M G',
        images: [
            'https://images.unsplash.com/photo-1485968817351-5c255e1c0715?w=800&q=80',
            'https://images.unsplash.com/photo-1485968817351-5c255e1c0715?w=800&q=80',
            'https://images.unsplash.com/photo-1485968817351-5c255e1c0715?w=800&q=80'
        ]
    },
    {
        id: '10', name: 'T-Shirt Basic', category: 'Blusas', price: 49.90, iconId: 'shirt', badge: '', badgeText: '', priceOld: '', priceNew: 'R$49,90', sub: '100% Algodão · Branco · P M G GG',
        images: [
            'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
            'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
            'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'
        ]
    }
];
// Repliquei os 10 primeiros para a base de dados ficar menor aqui no código,
// mas na prática você poderá ter quantas fotos e produtos quiser.