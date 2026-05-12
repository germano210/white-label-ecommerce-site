import { useState, useMemo } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { mockProducts } from '../../utils/mockProducts';
import {
    LogOut, TrendingUp, PackagePlus, ShoppingBag, Users,
    RefreshCcw, Search, CheckCircle, Clock, Plus, Trash2,
    UploadCloud, Phone, User as UserIcon, Calendar, ArrowRight,
    BarChart3, UserPlus, AlertTriangle, ChevronDown
} from 'lucide-react';

type AdminAction = 'BAIXA' | 'NOVO_ITEM' | 'CRM' | 'TROCA' | 'ESTATISTICAS' | 'EQUIPE' | null;

export function AdminDashboardScreen() {
    const { currentUser, logout, toggleAdminMode } = useAdminStore();
    const [activeAction, setActiveAction] = useState<AdminAction>(null);

    // --- ESTADOS: OPERAÇÕES DIÁRIAS ---
    const [buscaProduto, setBuscaProduto] = useState('');
    const [telefoneVenda, setTelefoneVenda] = useState('');
    const [nomeVenda, setNomeVenda] = useState('');
    const [statusVenda, setStatusVenda] = useState<'PAGO' | 'RESERVADO'>('PAGO');
    const [itensVenda, setItensVenda] = useState<any[]>([]);
    const [telefoneTroca, setTelefoneTroca] = useState('');
    const [itensDevolvidos, setItensDevolvidos] = useState<any[]>([]);
    const [estoqueGrade, setEstoqueGrade] = useState({ P: 0, M: 0, G: 0, GG: 0 });

    // --- ESTADOS: GERENCIAL ---
    const [filtroTempo, setFiltroTempo] = useState<'HOJE' | 'SEMANA' | 'MES' | 'ANO' | 'PERSONALIZADO'>('MES');
    const [novoVendedor, setNovoVendedor] = useState({ nome: '', email: '', senha: '' });

    // --- MOCKS DE DADOS ---
    const mockClientes = [
        { nome: 'Mariana Oliveira', tel: '5199887766', compras: 12, total: 1450.90, ultima: '12/05/2026' },
        { nome: 'Beatriz Souza', tel: '5198877554', compras: 3, total: 380.00, ultima: '10/05/2026' },
    ];

    const mockEquipe = [
        { id: 1, nome: 'Ana (Vendedora)', email: 'vendedor@viabras.com', vendas: 3120.00, comissao: 156.00 },
        { id: 2, nome: 'Julia (Vendedora)', email: 'julia@viabras.com', vendas: 2450.00, comissao: 122.50 },
    ];



    // --- LÓGICA DA BAIXA ---
    const produtosFiltrados = useMemo(() => {
        if (!buscaProduto) return [];
        return mockProducts.filter(p => p.name.toLowerCase().includes(buscaProduto.toLowerCase()) || p.id.toString() === buscaProduto).slice(0, 5);
    }, [buscaProduto]);

    // --- LÓGICA DA TROCA ---
    const adicionarItemTrocaTeste = () => {
        setItensDevolvidos([...itensDevolvidos, { id: Date.now(), nome: 'Peça do Histórico (Exemplo)', preco: 89.90 }]);
    };

    const adicionarAoCarrinho = (produto: any) => {
        setItensVenda([...itensVenda, { ...produto, tempId: Date.now(), tamanhoSelecionado: 'M' }]);
        setBuscaProduto('');
    };

    const totalVenda = itensVenda.reduce((acc, item) => acc + parseFloat(item.priceNew.replace('R$', '').replace('.', '').replace(',', '.')), 0);
    const totalTroca = itensDevolvidos.reduce((acc, item) => acc + item.preco, 0);

    return (
        <div style={{ position: 'fixed', inset: 0, background: '#F8F9FA', zIndex: 3000, overflowY: 'auto', paddingBottom: '60px' }}>

            {/* Top Bar */}
            <div style={{ background: 'white', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EEE', position: 'sticky', top: 0, zIndex: 100 }}>
                <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', margin: 0 }}>Painel Via Brás</h2>
                    <span style={{ fontSize: '10px', color: 'var(--terra)', fontWeight: 800 }}>MODO: {currentUser?.role}</span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={toggleAdminMode} style={{ background: '#F5F5F5', border: 'none', padding: '8px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>LOJA</button>
                    <button onClick={logout} style={{ color: '#FF3B30', background: 'none', border: 'none', cursor: 'pointer' }}><LogOut size={20}/></button>
                </div>
            </div>

            {/* VISÃO GERENCIAL (Apenas ADMIN) */}
            {currentUser?.role === 'ADMIN' && (
                <div style={{ padding: '20px 20px 0' }}>
                    <h3 style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 800, letterSpacing: '1px' }}>Visão Gerencial</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <button onClick={() => setActiveAction('ESTATISTICAS')} style={{ padding: '16px', borderRadius: '20px', border: 'none', background: activeAction === 'ESTATISTICAS' ? '#8A2BE2' : 'white', color: activeAction === 'ESTATISTICAS' ? 'white' : 'var(--dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: '0.2s', cursor: 'pointer' }}>
                            <BarChart3 size={24} /> <span style={{ fontSize: '12px', fontWeight: 700 }}>Relatórios</span>
                        </button>
                        <button onClick={() => setActiveAction('EQUIPE')} style={{ padding: '16px', borderRadius: '20px', border: 'none', background: activeAction === 'EQUIPE' ? '#007AFF' : 'white', color: activeAction === 'EQUIPE' ? 'white' : 'var(--dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: '0.2s', cursor: 'pointer' }}>
                            <UserPlus size={24} /> <span style={{ fontSize: '12px', fontWeight: 700 }}>Equipe</span>
                        </button>
                    </div>
                </div>
            )}

            {/* OPERAÇÕES DO DIA A DIA */}
            <div style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 800, letterSpacing: '1px' }}>Operações Diárias</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button onClick={() => setActiveAction('BAIXA')} style={{ padding: '16px', borderRadius: '20px', border: 'none', background: activeAction === 'BAIXA' ? 'var(--dark)' : 'white', color: activeAction === 'BAIXA' ? 'white' : 'var(--dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: '0.2s', cursor: 'pointer' }}>
                        <ShoppingBag size={24} color={activeAction === 'BAIXA' ? 'white' : 'var(--terra)'} /> <span style={{ fontSize: '12px', fontWeight: 700 }}>Dar Baixa</span>
                    </button>
                    <button onClick={() => setActiveAction('CRM')} style={{ padding: '16px', borderRadius: '20px', border: 'none', background: activeAction === 'CRM' ? 'var(--dark)' : 'white', color: activeAction === 'CRM' ? 'white' : 'var(--dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: '0.2s', cursor: 'pointer' }}>
                        <Users size={24} color={activeAction === 'CRM' ? 'white' : '#2D6A4F'} /> <span style={{ fontSize: '12px', fontWeight: 700 }}>Clientes</span>
                    </button>
                    <button onClick={() => setActiveAction('TROCA')} style={{ padding: '16px', borderRadius: '20px', border: 'none', background: activeAction === 'TROCA' ? 'var(--dark)' : 'white', color: activeAction === 'TROCA' ? 'white' : 'var(--dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: '0.2s', cursor: 'pointer' }}>
                        <RefreshCcw size={24} color={activeAction === 'TROCA' ? 'white' : '#F5A623'} /> <span style={{ fontSize: '12px', fontWeight: 700 }}>Trocas</span>
                    </button>
                    <button onClick={() => setActiveAction('NOVO_ITEM')} style={{ padding: '16px', borderRadius: '20px', border: 'none', background: activeAction === 'NOVO_ITEM' ? 'var(--dark)' : 'white', color: activeAction === 'NOVO_ITEM' ? 'white' : 'var(--dark)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', transition: '0.2s', cursor: 'pointer' }}>
                        <PackagePlus size={24} color={activeAction === 'NOVO_ITEM' ? 'white' : '#4A90E2'} /> <span style={{ fontSize: '12px', fontWeight: 700 }}>Novo Item</span>
                    </button>
                </div>
            </div>

            {/* ========================================== */}
            {/* SEÇÃO ADMIN: ESTATÍSTICAS AVANÇADAS        */}
            {/* ========================================== */}
            {activeAction === 'ESTATISTICAS' && currentUser?.role === 'ADMIN' && (
                <div style={{ margin: '0 20px', background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '18px', color: 'var(--dark)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart3 size={20} color="#8A2BE2" /> Relatório Financeiro
                    </h3>

                    {/* Filtros de Tempo */}
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
                        {['HOJE', 'SEMANA', 'MES', 'ANO', 'PERSONALIZADO'].map(t => (
                            <button key={t} onClick={() => setFiltroTempo(t as any)} style={{ padding: '8px 14px', borderRadius: '20px', border: `1px solid ${filtroTempo === t ? '#8A2BE2' : '#EEE'}`, background: filtroTempo === t ? '#8A2BE2' : 'white', color: filtroTempo === t ? 'white' : '#999', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}>
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* KPI Principal */}
                    <div style={{ background: '#F8F0FF', padding: '20px', borderRadius: '16px', marginTop: '10px', border: '1px solid #EEDFFF' }}>
                        <div style={{ fontSize: '12px', color: '#8A2BE2', fontWeight: 700, textTransform: 'uppercase' }}>Faturamento ({filtroTempo})</div>
                        <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--dark)', fontFamily: 'var(--font-display)', marginTop: '4px' }}>R$ 14.250,00</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '12px', color: '#666' }}>
                            <span><strong>124</strong> Peças vendidas</span>
                            <span>Ticket Médio: <strong>R$ 114,90</strong></span>
                        </div>
                    </div>

                    {/* Alertas de Estoque e Swipes */}
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ padding: '16px', background: '#FFF5F5', borderRadius: '16px', border: '1px solid #FFE5E5', display: 'flex', gap: '12px' }}>
                            <AlertTriangle size={20} color="#FF3B30" />
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#FF3B30' }}>Estoque Crítico</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>O "Vestido Canelado (M)" tem apenas 1 unidade restante.</div>
                            </div>
                        </div>

                        <div style={{ padding: '16px', background: '#F9F9F9', borderRadius: '16px', border: '1px solid #EEE' }}>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--dark)', marginBottom: '8px' }}>Métricas de Rejeição (App)</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>A "Blusa de Lã Azul" teve <strong style={{ color: '#FF3B30' }}>85% de rejeição</strong> (Passos) esta semana. Sugestão: Criar promoção.</div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* SEÇÃO ADMIN: EQUIPE & VENDEDORES           */}
            {/* ========================================== */}
            {activeAction === 'EQUIPE' && currentUser?.role === 'ADMIN' && (
                <div style={{ margin: '0 20px', background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '18px', color: 'var(--dark)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserPlus size={20} color="#007AFF" /> Gestão de Equipe
                    </h3>

                    {/* Lista de Vendedores e Ranking */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '12px', color: '#999', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>Ranking do Mês (Vendas)</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {mockEquipe.map((vendedor, index) => (
                                <div key={vendedor.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9F9F9', padding: '12px 16px', borderRadius: '12px', border: '1px solid #EEE' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: index === 0 ? '#FFD700' : '#E0E0E0', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>{index + 1}</div>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 700 }}>{vendedor.nome}</div>
                                            <div style={{ fontSize: '11px', color: '#007AFF' }}>Comissão (5%): R$ {vendedor.comissao.toFixed(2).replace('.', ',')}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--dark)' }}>
                                        R$ {vendedor.vendas.toFixed(2).replace('.', ',')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Cadastrar Novo Vendedor */}
                    <div style={{ borderTop: '1px solid #EEE', paddingTop: '20px' }}>
                        <div style={{ fontSize: '12px', color: '#999', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>Adicionar Vendedor</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <input type="text" placeholder="Nome Completo" value={novoVendedor.nome} onChange={e => setNovoVendedor({...novoVendedor, nome: e.target.value})} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #EEE', background: '#F9F9F9', fontSize: '14px', outline: 'none' }} />
                            <input type="email" placeholder="E-mail de Login" value={novoVendedor.email} onChange={e => setNovoVendedor({...novoVendedor, email: e.target.value})} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #EEE', background: '#F9F9F9', fontSize: '14px', outline: 'none' }} />
                            <input type="password" placeholder="Senha provisória" value={novoVendedor.senha} onChange={e => setNovoVendedor({...novoVendedor, senha: e.target.value})} style={{ padding: '12px', borderRadius: '12px', border: '1px solid #EEE', background: '#F9F9F9', fontSize: '14px', outline: 'none' }} />
                            <button style={{ padding: '14px', borderRadius: '12px', border: 'none', background: '#007AFF', color: 'white', fontWeight: 700, marginTop: '4px', cursor: 'pointer' }}>Criar Acesso</button>
                        </div>
                    </div>
                </div>
            )}

            {/* AS SEÇÕES EXISTENTES CONTINUAM AQUI (Ocultadas para o código focar no novo) */}
            {/* Pode colar as seções de BAIXA, CRM, TROCA e NOVO_ITEM do código anterior logo abaixo desta linha */}

            {activeAction === 'BAIXA' && (
                <div style={{ margin: '0 20px', background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#AAA', textTransform: 'uppercase' }}>1. Cliente</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F9F9F9', padding: '12px', borderRadius: '12px' }}>
                                <Phone size={18} color="#CCC" />
                                <input type="tel" placeholder="WhatsApp (Identificador)" value={telefoneVenda} onChange={e => setTelefoneVenda(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F9F9F9', padding: '12px', borderRadius: '12px' }}>
                                <UserIcon size={18} color="#CCC" />
                                <input type="text" placeholder="Nome da Cliente" value={nomeVenda} onChange={e => setNomeVenda(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%' }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#AAA', textTransform: 'uppercase' }}>2. Adicionar Peças</label>
                        <div style={{ position: 'relative', marginTop: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F9F9F9', padding: '12px', borderRadius: '12px', border: buscaProduto ? '1.5px solid var(--terra)' : '1.5px solid transparent' }}>
                                <Search size={18} color="#999" />
                                <input type="text" placeholder="Buscar por Nome ou ID..." value={buscaProduto} onChange={e => setBuscaProduto(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%' }} />
                            </div>

                            {produtosFiltrados.length > 0 && (
                                <div style={{ position: 'absolute', top: '55px', left: 0, right: 0, background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 10, border: '1px solid #EEE' }}>
                                    {produtosFiltrados.map(p => (
                                        <div key={p.id} onClick={() => adicionarAoCarrinho(p)} style={{ padding: '12px', borderBottom: '1px solid #F5F5F5', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
                                            <span style={{ fontSize: '13px' }}><strong>#{p.id}</strong> {p.name}</span>
                                            <span style={{ color: 'var(--terra)', fontWeight: 700, fontSize: '13px' }}>{p.priceNew}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {itensVenda.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {itensVenda.map(item => (
                                    <div key={item.tempId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#FFF8FA', borderRadius: '12px', border: '1px solid #FFEBF2' }}>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 700 }}>{item.name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--terra)' }}>{item.priceNew} · Tam: M</div>
                                        </div>
                                        <button onClick={() => setItensVenda(itensVenda.filter(i => i.tempId !== item.tempId))} style={{ border: 'none', background: 'none', color: '#FF3B30', cursor: 'pointer' }}><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: '16px', textAlign: 'right' }}>
                                <span style={{ fontSize: '12px', color: '#999' }}>Total: </span>
                                <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>R$ {totalVenda.toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button onClick={() => setStatusVenda('PAGO')} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: statusVenda === 'PAGO' ? '#34C759' : '#EEE', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}><CheckCircle size={18}/> Pago</button>
                        <button onClick={() => setStatusVenda('RESERVADO')} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: statusVenda === 'RESERVADO' ? '#F5A623' : '#EEE', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}><Clock size={18}/> Reservar</button>
                    </div>

                    <button disabled={itensVenda.length === 0 || !telefoneVenda} style={{ width: '100%', marginTop: '12px', padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--dark)', color: 'white', fontWeight: 700, cursor: (itensVenda.length === 0 || !telefoneVenda) ? 'not-allowed' : 'pointer', opacity: (itensVenda.length === 0 || !telefoneVenda) ? 0.3 : 1 }}>
                        Finalizar e Baixar Estoque
                    </button>
                </div>
            )}

            {/* ========================================== */}
            {/* SEÇÃO: BAIXA (VENDA)                       */}
            {/* ========================================== */}
            {activeAction === 'BAIXA' && (
                <div style={{ margin: '0 20px', background: 'white', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#AAA', textTransform: 'uppercase' }}>1. Cliente</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F9F9F9', padding: '12px', borderRadius: '12px' }}>
                                <Phone size={18} color="#CCC" />
                                <input type="tel" placeholder="WhatsApp (Identificador)" value={telefoneVenda} onChange={e => setTelefoneVenda(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F9F9F9', padding: '12px', borderRadius: '12px' }}>
                                <UserIcon size={18} color="#CCC" />
                                <input type="text" placeholder="Nome da Cliente" value={nomeVenda} onChange={e => setNomeVenda(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%' }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 700, color: '#AAA', textTransform: 'uppercase' }}>2. Adicionar Peças (Nome ou ID)</label>
                        <div style={{ position: 'relative', marginTop: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#F9F9F9', padding: '12px', borderRadius: '12px', border: buscaProduto ? '1.5px solid var(--terra)' : '1.5px solid transparent' }}>
                                <Search size={18} color="#999" />
                                <input type="text" placeholder="Pesquisar..." value={buscaProduto} onChange={e => setBuscaProduto(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%' }} />
                            </div>

                            {produtosFiltrados.length > 0 && (
                                <div style={{ position: 'absolute', top: '55px', left: 0, right: 0, background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 10, border: '1px solid #EEE' }}>
                                    {produtosFiltrados.map(p => (
                                        <div key={p.id} onClick={() => adicionarAoCarrinho(p)} style={{ padding: '12px', borderBottom: '1px solid #F5F5F5', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
                                            <span style={{ fontSize: '13px' }}><strong>#{p.id}</strong> {p.name}</span>
                                            <span style={{ color: 'var(--terra)', fontWeight: 700, fontSize: '13px' }}>{p.priceNew}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {itensVenda.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 700, color: '#AAA', textTransform: 'uppercase' }}>Itens Selecionados</label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                                {itensVenda.map(item => (
                                    <div key={item.tempId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#FFF8FA', borderRadius: '12px', border: '1px solid #FFEBF2' }}>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 700 }}>{item.name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--terra)' }}>{item.priceNew} · Tam: M</div>
                                        </div>
                                        <button onClick={() => setItensVenda(itensVenda.filter(i => i.tempId !== item.tempId))} style={{ border: 'none', background: 'none', color: '#FF3B30', cursor: 'pointer' }}><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: '16px', textAlign: 'right' }}>
                                <span style={{ fontSize: '12px', color: '#999' }}>Total: </span>
                                <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>R$ {totalVenda.toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                        <button onClick={() => setStatusVenda('PAGO')} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: statusVenda === 'PAGO' ? '#34C759' : '#EEE', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}><CheckCircle size={18}/> Pago</button>
                        <button onClick={() => setStatusVenda('RESERVADO')} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: statusVenda === 'RESERVADO' ? '#F5A623' : '#EEE', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}><Clock size={18}/> Reservar</button>
                    </div>

                    <button disabled={itensVenda.length === 0 || !telefoneVenda} style={{ width: '100%', marginTop: '12px', padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--dark)', color: 'white', fontWeight: 700, cursor: (itensVenda.length === 0 || !telefoneVenda) ? 'not-allowed' : 'pointer', opacity: (itensVenda.length === 0 || !telefoneVenda) ? 0.3 : 1 }}>
                        Finalizar e Baixar Estoque
                    </button>
                </div>
            )}

            {/* ========================================== */}
            {/* SEÇÃO: CRM (PAINEL DE CLIENTES)            */}
            {/* ========================================== */}
            {activeAction === 'CRM' && (
                <div style={{ padding: '0 20px' }}>
                    <div style={{ background: 'white', borderRadius: '24px', padding: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '16px', margin: 0 }}>Fidelidade Clientes</h3>
                            <span style={{ fontSize: '11px', background: '#EEE', padding: '4px 8px', borderRadius: '8px' }}>{mockClientes.length} cadastradas</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {mockClientes.map(c => (
                                <div key={c.tel} style={{ padding: '16px', border: '1px solid #F0F0F0', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: 700 }}>{c.nome}</div>
                                            <div style={{ fontSize: '12px', color: '#999', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12}/> {c.tel}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#34C759' }}>R$ {c.total.toFixed(2).replace('.', ',')}</div>
                                            <div style={{ fontSize: '10px', color: '#999' }}>Total Investido</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px dotted #EEE' }}>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <div style={{ fontSize: '11px' }}><strong>{c.compras}</strong> Compras</div>
                                            <div style={{ fontSize: '11px', color: '#999' }}><Calendar size={10} style={{ verticalAlign: 'middle' }}/> {c.ultima}</div>
                                        </div>
                                        <button style={{ border: 'none', background: 'var(--soft)', color: 'var(--terra)', padding: '6px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>HISTÓRICO <ArrowRight size={10}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* SEÇÃO: TROCA / DEVOLUÇÃO                   */}
            {/* ========================================== */}
            {activeAction === 'TROCA' && (
                <div style={{ margin: '0 20px', padding: '24px', background: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '18px', color: 'var(--dark)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <RefreshCcw size={20} color="#F5A623" /> Trocas / Devoluções
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Busca do Cliente pelo Histórico (Telefone) */}
                        <div style={{ background: '#F9F9F9', padding: '16px', borderRadius: '16px', border: '1px solid #EEE' }}>
                            <label style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Buscar Histórico</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                                <Search size={18} color="#999" />
                                <input type="tel" placeholder="Telefone do Cliente..." value={telefoneTroca} onChange={e => setTelefoneTroca(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '16px' }} />
                            </div>
                        </div>

                        {/* Peças sendo Devolvidas */}
                        <div style={{ border: '1px solid #EEE', borderRadius: '16px', padding: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <label style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Peças a Devolver</label>
                                <button onClick={adicionarItemTrocaTeste} style={{ background: '#FFF5E5', color: '#D08A1E', border: 'none', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                    <Plus size={14} /> Histórico
                                </button>
                            </div>

                            {itensDevolvidos.length === 0 ? (
                                <div style={{ fontSize: '13px', color: '#CCC', textAlign: 'center', padding: '20px 0' }}>Nenhuma peça selecionada para troca.</div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {itensDevolvidos.map((item) => (
                                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F9F9F9', padding: '12px', borderRadius: '12px' }}>
                                            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--dark)' }}>{item.nome}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ fontSize: '14px', color: '#F5A623', fontWeight: 700 }}>R$ {item.preco.toFixed(2).replace('.', ',')}</div>
                                                <button onClick={() => setItensDevolvidos(itensDevolvidos.filter(i => i.id !== item.id))} style={{ border: 'none', background: 'none', color: '#FF3B30', cursor: 'pointer' }}><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Motivo e Finalização */}
                        {itensDevolvidos.length > 0 && (
                            <div>
                                <label style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Motivo da Devolução</label>
                                <select style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #EEE', background: '#F9F9F9', fontSize: '14px', outline: 'none', marginTop: '6px', cursor: 'pointer' }}>
                                    <option>Tamanho não serviu</option>
                                    <option>Defeito na Peça</option>
                                    <option>Arrependimento</option>
                                </select>
                            </div>
                        )}

                        <button disabled={itensDevolvidos.length === 0 || !telefoneTroca} style={{ background: (itensDevolvidos.length > 0 && telefoneTroca) ? 'var(--dark)' : '#CCC', color: 'white', padding: '16px', borderRadius: '16px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: (itensDevolvidos.length > 0 && telefoneTroca) ? 'pointer' : 'not-allowed', marginTop: '10px' }}>
                            Gerar Crédito de R$ {totalTroca.toFixed(2).replace('.', ',')}
                        </button>
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* SEÇÃO: NOVO ITEM (CADASTRAR PRODUTO)       */}
            {/* ========================================== */}
            {activeAction === 'NOVO_ITEM' && (
                <div style={{ margin: '0 20px', padding: '24px', background: 'white', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '18px', color: 'var(--dark)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PackagePlus size={20} color="#4A90E2" /> Cadastrar Peça
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Upload de Fotos */}
                        <div style={{ width: '100%', height: '120px', borderRadius: '16px', border: '2px dashed #DDD', background: '#F9F9F9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#999', cursor: 'pointer' }}>
                            <UploadCloud size={32} />
                            <span style={{ fontSize: '13px', fontWeight: 600 }}>Toque para adicionar fotos</span>
                        </div>

                        {/* Dados Básicos */}
                        <div>
                            <input type="text" placeholder="Nome da Peça (Ex: Vestido Canelado)" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #EEE', background: '#F9F9F9', fontSize: '14px', outline: 'none', marginBottom: '10px' }} />
                            <input type="text" placeholder="Detalhes (Ex: Algodão · Preto e Branco)" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #EEE', background: '#F9F9F9', fontSize: '14px', outline: 'none' }} />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <input type="number" placeholder="Preço Venda (R$)" style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #EEE', background: '#F9F9F9', fontSize: '14px', outline: 'none' }} />
                            <input type="number" placeholder="Preço Antigo" style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #EEE', background: '#F9F9F9', fontSize: '14px', outline: 'none' }} />
                        </div>

                        {/* Categorias (Tags Dinâmicas) */}
                        <div>
                            <label style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Categorias</label>
                            <input type="text" placeholder="Digite e aperte Enter..." style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #EEE', marginTop: '6px', outline: 'none', fontSize: '14px' }} />
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                                <span style={{ background: 'var(--dark)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', cursor: 'pointer' }}>Calças ✕</span>
                                <span style={{ background: 'var(--dark)', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', cursor: 'pointer' }}>Inverno ✕</span>
                            </div>
                        </div>

                        {/* Grade de Estoque */}
                        <div style={{ background: '#F9F9F9', padding: '16px', borderRadius: '16px', border: '1px solid #EEE' }}>
                            <label style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>Grade de Estoque</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {['P', 'M', 'G', 'GG'].map(tamanho => (
                                    <div key={tamanho} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dark)' }}>{tamanho}</span>
                                        <input type="number" min="0" value={estoqueGrade[tamanho as keyof typeof estoqueGrade]} onChange={(e) => setEstoqueGrade({...estoqueGrade, [tamanho]: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #DDD', textAlign: 'center', outline: 'none', fontSize: '16px' }} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button style={{ background: '#4A90E2', color: 'white', padding: '16px', borderRadius: '16px', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                            Salvar Produto e Estoque
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}