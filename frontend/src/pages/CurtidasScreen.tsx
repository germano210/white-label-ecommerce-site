import { useDiscoveryStore } from '../store/useDiscoveryStore';
import { useEffect, useState } from 'react';
import { ArrowLeft, Trash2, Check, Send, User } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';
import { api } from '../utils/api';
import { apiRoutes } from '../utils/apiRoutes';
import { appRoutes } from '../utils/appRoutes';

interface CurtidasScreenProps {
    onBack?: () => void;
}

interface CreateCheckoutResponse {
    checkoutUrl?: string;
    gatewayUrl?: string;
    url?: string;
    pedidoId?: string | number;
}

export function CurtidasScreen({ onBack }: CurtidasScreenProps) {
    const {
        likedItems,
        itemPrefs,
        curtidasMode,
        isCurtidasLoading,
        curtidasError,
        fetchCurtidas,
        setItemSize,
        toggleSelection,
        removeLikedItem,
        userName,
        setUserName,
    } = useDiscoveryStore();
    const [checkoutError, setCheckoutError] = useState('');
    const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

    useEffect(() => {
        void fetchCurtidas();
    }, [fetchCurtidas]);

    const selectedItems = likedItems.filter(item => itemPrefs[item.id]?.isSelected);

    // Calcula o total somando apenas as peças que estão com a checkbox marcada
    const total = likedItems.reduce((acc, item) => {
        if (itemPrefs[item.id]?.isSelected) {
            // Converte "R$79,90" para 79.90 matemático
            const priceNum = parseFloat(item.priceNew.replace('R$', '').replace('.', '').replace(',', '.'));
            return acc + (isNaN(priceNum) ? 0 : priceNum);
        }
        return acc;
    }, 0);

    const handleCheckout = async () => {
        if (selectedItems.length === 0 || !userName.trim()) return;

        setCheckoutError('');
        setIsCreatingCheckout(true);

        try {
            const successUrl = new URL(appRoutes.checkoutSuccess, window.location.origin);
            const cancelUrl = new URL(window.location.href);
            const { data } = await api.post<CreateCheckoutResponse>(apiRoutes.checkout.create, {
                clienteNome: userName.trim(),
                itens: selectedItems.map((item) => ({
                    produtoId: item.id,
                    tamanho: itemPrefs[item.id]?.size ?? item.tamanho,
                    quantidade: 1,
                })),
                successUrl: successUrl.toString(),
                cancelUrl: cancelUrl.toString(),
            });
            const checkoutUrl = data.checkoutUrl ?? data.gatewayUrl ?? data.url;

            if (!checkoutUrl) {
                throw new Error('Checkout sem URL de redirecionamento.');
            }

            window.location.assign(checkoutUrl);
        } catch {
            setCheckoutError('Não foi possível criar o checkout agora. Tente novamente.');
        } finally {
            setIsCreatingCheckout(false);
        }
    };

    if (isCurtidasLoading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', border: '3px solid #E8DED6', borderTopColor: 'var(--terra)', animation: 'spin 0.8s linear infinite' }} />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--dark)', marginTop: '20px' }}>Carregando curtidas</h2>
                <p style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '10px' }}>Estamos buscando suas peças separadas.</p>
            </div>
        );
    }

    if (curtidasError) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px 20px', textAlign: 'center' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--dark)', marginTop: '20px' }}>Não conseguimos carregar</h2>
                <p style={{ fontSize: '14px', color: 'var(--muted)', marginTop: '10px' }}>{curtidasError}</p>
                <button type="button" onClick={() => void fetchCurtidas()} style={{ marginTop: '18px', padding: '12px 18px', border: 0, borderRadius: '14px', color: 'white', background: 'var(--terra)', fontWeight: 700, cursor: 'pointer' }}>
                    Tentar novamente
                </button>
            </div>
        );
    }

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

            <div style={{ position: 'relative', padding: '20px 16px', textAlign: 'center', borderBottom: '1px solid #EEEEEE' }}>
                {onBack && (
                    <button
                        type="button"
                        onClick={onBack}
                        aria-label="Voltar para descoberta"
                        style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', display: 'grid', width: '34px', height: '34px', placeItems: 'center', border: 0, borderRadius: '999px', color: 'var(--dark)', background: '#F5F0EA', cursor: 'pointer' }}
                    >
                        <ArrowLeft size={18} />
                    </button>
                )}
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--dark)' }}>
                    {curtidasMode === 'resgate' ? 'Resgatar tentativa' : 'Minhas Curtidas'}
                </h2>
                {curtidasMode === 'resgate' && (
                    <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '12px', fontWeight: 700 }}>
                        Escolha uma peça curtida para usar sua tentativa.
                    </p>
                )}
            </div>

            {/* CAMPO DE NOME NO CARRINHO */}
            <div style={{ padding: '16px 16px 0' }}>
                <div style={{
                    background: 'white', padding: '12px 16px', borderRadius: '16px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    border: `1.5px solid ${!userName.trim() ? 'var(--terra)' : '#EEE'}`,
                    transition: 'all 0.3s ease'
                }}>
                    <User size={20} color={!userName.trim() ? 'var(--terra)' : '#999'} />
                    <input
                        type="text"
                        placeholder="Digite seu nome para separar..."
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', background: 'transparent' }}
                    />
                </div>
                {!userName.trim() && (
                    <span style={{ fontSize: '10px', color: 'var(--terra)', marginLeft: '12px', fontWeight: 600 }}>
                        * Precisamos do seu nome para enviar o pedido
                    </span>
                )}
                {checkoutError && (
                    <div role="alert" style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '12px', color: '#A63D2F', background: '#FFF0ED', fontSize: '12px', fontWeight: 700 }}>
                        {checkoutError}
                    </div>
                )}
            </div>

            {/* LISTA DE PRODUTOS */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingBottom: '120px' }}>
                {likedItems.map(item => {
                    const pref = itemPrefs[item.id];
                    const isSelected = pref?.isSelected;

                    const imageUrl = getImageUrl(item.images?.[0]);

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
                            <img src={imageUrl} alt={item.name} style={{ width: '80px', height: '110px', objectFit: 'cover', borderRadius: '12px' }} />

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

            {/* BARRA FIXA DE CHECKOUT */}
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
                    onClick={() => void handleCheckout()}
                    disabled={total === 0 || !userName.trim() || isCreatingCheckout}
                    style={{
                        background: (total > 0 && userName.trim() && !isCreatingCheckout) ? 'var(--terra)' : '#DDDDDD',
                        color: 'white', border: 'none', padding: '14px 24px',
                        borderRadius: '16px', fontSize: '14px', fontWeight: 700,
                        display: 'flex', alignItems: 'center', gap: '8px',
                        cursor: (total > 0 && userName.trim() && !isCreatingCheckout) ? 'pointer' : 'not-allowed',
                        boxShadow: (total > 0 && userName.trim() && !isCreatingCheckout) ? '0 8px 20px rgba(230, 57, 143, 0.3)' : 'none',
                        transition: 'all 0.3s ease'
                    }}
                >
                    {isCreatingCheckout ? 'Criando...' : 'Pagar'} <Send size={16} style={{ transform: 'rotate(-20deg) translateX(2px)' }} />
                </button>
            </div>
        </div>
    );
}
