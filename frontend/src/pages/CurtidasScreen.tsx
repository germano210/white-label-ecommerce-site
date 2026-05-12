import { useDiscoveryStore } from '../store/useDiscoveryStore';
import { Trash2, Check, Send } from 'lucide-react';

export function CurtidasScreen() {
    const { likedItems, itemPrefs, setItemSize, toggleSelection, removeLikedItem } = useDiscoveryStore();

    // Calcula o total somando apenas as peças que estão com a checkbox marcada
    const total = likedItems.reduce((acc, item) => {
        if (itemPrefs[item.id]?.isSelected) {
            // Converte "R$79,90" para 79.90 matemático
            const priceNum = parseFloat(item.priceNew.replace('R$', '').replace('.', '').replace(',', '.'));
            return acc + (isNaN(priceNum) ? 0 : priceNum);
        }
        return acc;
    }, 0);

    const handleWhatsApp = () => {
        const selectedItems = likedItems.filter(item => itemPrefs[item.id]?.isSelected);
        if (selectedItems.length === 0) return;

        let text = "Olá Via Brás! Separei estas peças no site e gostaria de saber a disponibilidade:\n\n";

        selectedItems.forEach(item => {
            const pref = itemPrefs[item.id];
            text += ` *${item.name}*\n`;
            text += `Tamanho: ${pref.size}\n`;
            text += `Detalhes: ${item.sub.split('·').slice(0, 2).join('·')}\n`;
            text += `Valor: ${item.priceNew}\n\n`;
        });

        text += `*Total estimado: R$ ${total.toFixed(2).replace('.', ',')}*\n\nAguardo o retorno!`;

        const encoded = encodeURIComponent(text);
        // Substitua este número pelo WhatsApp real da loja (ex: 5511999999999)
        window.open(`https://wa.me/5551999522296?text=${encoded}`, '_blank');
    };

    if (likedItems.length === 0) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '64px', opacity: 0.8 }}>💖</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--dark)', marginTop: '20px' }}>Lista Vazia</h2>
                <p style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '10px' }}>Você ainda não separou nenhuma peça.</p>
            </div>
        );
    }

    return (
        <div style={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', background: 'var(--cream)' }}>

            <div style={{ padding: '20px 16px', textAlign: 'center', borderBottom: '1px solid #EEEEEE' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--dark)' }}>Minhas Curtidas</h2>
            </div>

            {/* LISTA DE PRODUTOS */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '120px' }}>
                {likedItems.map(item => {
                    const pref = itemPrefs[item.id];
                    const isSelected = pref?.isSelected;
                    const images = (item as any).images || ['https://via.placeholder.com/150'];

                    return (
                        <div key={item.id} style={{ display: 'flex', gap: '12px', background: 'white', padding: '12px', borderRadius: '20px', marginBottom: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>

                            {/* Checkbox */}
                            <div onClick={() => toggleSelection(item.id)} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <div style={{
                                    width: '24px', height: '24px', borderRadius: '6px',
                                    border: `2px solid ${isSelected ? 'var(--terra)' : '#DDDDDD'}`,
                                    background: isSelected ? 'var(--terra)' : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s ease'
                                }}>
                                    {isSelected && <Check size={16} strokeWidth={3} color="white" />}
                                </div>
                            </div>

                            {/* Imagem (Thumbnail) */}
                            <img src={images[0]} alt={item.name} style={{ width: '80px', height: '110px', objectFit: 'cover', borderRadius: '12px' }} />

                            {/* Detalhes e Controles */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', margin: 0, color: 'var(--dark)', lineHeight: 1.1 }}>{item.name}</h4>
                                        <button onClick={() => removeLikedItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#BBBBBB', padding: '0 0 4px 4px' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                                        {item.sub.split('·').slice(0, 2).join('·')}
                                    </div>
                                </div>

                                {/* Seletor de Tamanhos (Pill Buttons) */}
                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                    {['P', 'M', 'G'].map(sz => (
                                        <button
                                            key={sz}
                                            onClick={() => setItemSize(item.id, sz)}
                                            style={{
                                                padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                                                border: `1px solid ${pref?.size === sz ? 'var(--terra)' : '#EEEEEE'}`,
                                                background: pref?.size === sz ? 'var(--soft)' : 'white',
                                                color: pref?.size === sz ? 'var(--terra)' : '#999999',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            {sz}
                                        </button>
                                    ))}
                                </div>

                                {/* Preço */}
                                <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, color: 'var(--dark)', marginTop: '8px' }}>
                                    {item.priceNew}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* BARRA FIXA DE CHECKOUT (Fica exatamente em cima da BottomNavigation) */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100,
                background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)',
                borderTop: '1px solid #EEEEEE', padding: '16px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.05)'
            }}>
                <div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Selecionado</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 600, color: 'var(--dark)', lineHeight: 1 }}>
                        R$ {total.toFixed(2).replace('.', ',')}
                    </div>
                </div>

                <button
                    onClick={handleWhatsApp}
                    disabled={total === 0}
                    style={{
                        background: total > 0 ? 'var(--terra)' : '#DDDDDD',
                        color: 'white', border: 'none', padding: '14px 24px',
                        borderRadius: '16px', fontSize: '14px', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: total > 0 ? 'pointer' : 'not-allowed',
                        boxShadow: total > 0 ? '0 8px 20px rgba(230, 57, 143, 0.3)' : 'none',
                        transition: 'all 0.3s ease'
                    }}
                >
                    Separar Peças <Send size={16} style={{ transform: 'rotate(-20deg) translateX(2px)' }} />
                </button>
            </div>
        </div>
    );
}