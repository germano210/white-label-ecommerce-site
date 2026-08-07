import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, Gift, Save, Trash2 } from 'lucide-react';
import { api } from '../../utils/api';
import { apiRoutes } from '../../utils/apiRoutes';
import { getImageUrl } from '../../utils/imageUtils';

interface ProdutoAdmin {
    id: number | string;
    nome: string;
    precoVenda: number | string;
    tamanho?: string | null;
    imagemUrl?: string | null;
    imagens?: ProdutoImagemApi[] | null;
}

type ProdutoImagemApi = string | {
    id?: number | string | null;
    url?: string | null;
    imagemUrl?: string | null;
    caminho?: string | null;
    path?: string | null;
    principal?: boolean | number | string | null;
    ordem?: number | string | null;
};

interface ProdutosPage {
    content?: ProdutoAdmin[];
}

interface AdminRoletaResponse {
    ativa?: boolean | null;
    titulo?: string | null;
    metaGrupo?: number | null;
    progressoGrupo?: number | null;
    girosBonusGrupo?: number | null;
    girosIniciais?: number | null;
    giroDiarioQuantidade?: number | null;
    giroDiarioSomenteQuandoZerar?: boolean | null;
    girosGanhosPorConvite?: number | null;
    produtoIds?: Array<number | string> | null;
}

interface RoletaFormState {
    ativa: boolean;
    titulo: string;
    metaGrupo: string;
    girosBonusGrupo: string;
    girosIniciais: string;
    giroDiarioQuantidade: string;
    giroDiarioSomenteQuandoZerar: boolean;
    girosGanhosPorConvite: string;
}

function createDefaultForm(): RoletaFormState {
    return {
        ativa: true,
        titulo: 'Brecho da Cami',
        metaGrupo: '20',
        girosBonusGrupo: '2',
        girosIniciais: '8',
        giroDiarioQuantidade: '1',
        giroDiarioSomenteQuandoZerar: true,
        girosGanhosPorConvite: '1',
    };
}

function toPositiveInteger(value: string, fallback: number) {
    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) return fallback;
    return Math.max(0, Math.floor(parsedValue));
}

function getProdutoImagePath(image: ProdutoImagemApi) {
    if (typeof image === 'string') return image;
    return image.url ?? image.imagemUrl ?? image.caminho ?? image.path ?? '';
}

function isPrincipalImage(value: unknown) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
    return false;
}

function getProdutoMainImage(produto: ProdutoAdmin) {
    const orderedImages = (produto.imagens ?? [])
        .map((image, index) => ({
            path: getProdutoImagePath(image),
            principal: typeof image === 'object' && image !== null
                ? isPrincipalImage(image.principal)
                : false,
            ordem: typeof image === 'object' && image !== null ? Number(image.ordem ?? index) : index,
        }))
        .filter((image) => image.path.trim())
        .sort((a, b) => {
            if (a.principal !== b.principal) return a.principal ? -1 : 1;
            return a.ordem - b.ordem;
        });

    return getImageUrl(orderedImages[0]?.path ?? produto.imagemUrl);
}

function formatPrice(value: number | string) {
    const parsedValue = typeof value === 'number'
        ? value
        : Number(String(value).replace(',', '.')) || 0;

    return parsedValue.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

function normalizeIds(ids?: Array<number | string> | null) {
    return (ids ?? [])
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id));
}

export function RoletaAdminPanel() {
    const [form, setForm] = useState<RoletaFormState>(createDefaultForm);
    const [produtos, setProdutos] = useState<ProdutoAdmin[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [addProdutoId, setAddProdutoId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const produtosById = useMemo(() => (
        produtos.reduce<Record<number, ProdutoAdmin>>((acc, produto) => {
            acc[Number(produto.id)] = produto;
            return acc;
        }, {})
    ), [produtos]);

    const selectedProdutos = selectedIds
        .map((id) => produtosById[id])
        .filter((produto): produto is ProdutoAdmin => Boolean(produto));

    const availableProdutos = produtos.filter((produto) => (
        !selectedIds.includes(Number(produto.id))
    ));

    const loadPanel = useCallback(async () => {
        setIsLoading(true);
        setError('');

        try {
            const [{ data: roleta }, { data: produtosData }] = await Promise.all([
                api.get<AdminRoletaResponse>(apiRoutes.admin.roleta),
                api.get<ProdutoAdmin[] | ProdutosPage>(apiRoutes.admin.produtos.list),
            ]);
            const apiProdutos = Array.isArray(produtosData)
                ? produtosData
                : produtosData.content ?? [];

            setProdutos(apiProdutos);
            setSelectedIds(normalizeIds(roleta.produtoIds));
            setForm({
                ativa: roleta.ativa ?? true,
                titulo: roleta.titulo ?? 'Brecho da Cami',
                metaGrupo: String(roleta.metaGrupo ?? 20),
                girosBonusGrupo: String(roleta.girosBonusGrupo ?? 2),
                girosIniciais: String(roleta.girosIniciais ?? 8),
                giroDiarioQuantidade: String(roleta.giroDiarioQuantidade ?? 1),
                giroDiarioSomenteQuandoZerar: roleta.giroDiarioSomenteQuandoZerar ?? true,
                girosGanhosPorConvite: String(roleta.girosGanhosPorConvite ?? 1),
            });
        } catch {
            setError('Nao foi possivel carregar a configuracao da roleta.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadPanel();
    }, [loadPanel]);

    const updateForm = <K extends keyof RoletaFormState>(
        key: K,
        value: RoletaFormState[K],
    ) => {
        setForm((currentForm) => ({
            ...currentForm,
            [key]: value,
        }));
    };

    const addProduto = () => {
        const nextId = Number(addProdutoId);
        if (!Number.isFinite(nextId) || selectedIds.includes(nextId)) return;

        setSelectedIds((currentIds) => [...currentIds, nextId]);
        setAddProdutoId('');
    };

    const removeProduto = (produtoId: number) => {
        setSelectedIds((currentIds) => currentIds.filter((id) => id !== produtoId));
    };

    const moveProduto = (produtoId: number, direction: -1 | 1) => {
        setSelectedIds((currentIds) => {
            const currentIndex = currentIds.indexOf(produtoId);
            const nextIndex = currentIndex + direction;

            if (currentIndex < 0 || nextIndex < 0 || nextIndex >= currentIds.length) {
                return currentIds;
            }

            const nextIds = [...currentIds];
            [nextIds[currentIndex], nextIds[nextIndex]] = [
                nextIds[nextIndex],
                nextIds[currentIndex],
            ];

            return nextIds;
        });
    };

    const savePanel = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const { data } = await api.put<AdminRoletaResponse>(apiRoutes.admin.roleta, {
                ativa: form.ativa,
                titulo: form.titulo.trim(),
                metaGrupo: Math.max(1, toPositiveInteger(form.metaGrupo, 20)),
                girosBonusGrupo: toPositiveInteger(form.girosBonusGrupo, 2),
                girosIniciais: toPositiveInteger(form.girosIniciais, 8),
                giroDiarioQuantidade: toPositiveInteger(form.giroDiarioQuantidade, 1),
                giroDiarioSomenteQuandoZerar: form.giroDiarioSomenteQuandoZerar,
                girosGanhosPorConvite: toPositiveInteger(form.girosGanhosPorConvite, 1),
                produtoIds: selectedIds,
            });

            setSelectedIds(normalizeIds(data.produtoIds));
            setSuccess('Roleta atualizada com sucesso.');
        } catch {
            setError('Nao foi possivel salvar a roleta. Confira os campos e tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={panelStyle}>
            <h3 style={panelTitleStyle}>
                <Gift size={20} color="#687152" />
                Roleta VIP
            </h3>

            {isLoading ? (
                <div style={emptyStyle}>Carregando roleta...</div>
            ) : (
                <form onSubmit={savePanel} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={toggleStyle}>
                        <input
                            type="checkbox"
                            checked={form.ativa}
                            onChange={(event) => updateForm('ativa', event.target.checked)}
                        />
                        Roleta ativa
                    </label>

                    <input
                        value={form.titulo}
                        onChange={(event) => updateForm('titulo', event.target.value)}
                        placeholder="Titulo da roleta"
                        style={inputStyle}
                        required
                    />

                    <div style={gridStyle}>
                        <input type="number" min="1" value={form.metaGrupo} onChange={(event) => updateForm('metaGrupo', event.target.value)} placeholder="Meta do grupo" style={inputStyle} />
                        <input type="number" min="0" value={form.girosBonusGrupo} onChange={(event) => updateForm('girosBonusGrupo', event.target.value)} placeholder="Giros bonus" style={inputStyle} />
                        <input type="number" min="0" value={form.girosIniciais} onChange={(event) => updateForm('girosIniciais', event.target.value)} placeholder="Giros iniciais" style={inputStyle} />
                        <input type="number" min="0" value={form.giroDiarioQuantidade} onChange={(event) => updateForm('giroDiarioQuantidade', event.target.value)} placeholder="Giro diario" style={inputStyle} />
                        <input type="number" min="0" value={form.girosGanhosPorConvite} onChange={(event) => updateForm('girosGanhosPorConvite', event.target.value)} placeholder="Giros por convite" style={inputStyle} />
                    </div>

                    <label style={toggleStyle}>
                        <input
                            type="checkbox"
                            checked={form.giroDiarioSomenteQuandoZerar}
                            onChange={(event) => updateForm('giroDiarioSomenteQuandoZerar', event.target.checked)}
                        />
                        Liberar giro diario somente quando zerar chances
                    </label>

                    <section style={sectionStyle}>
                        <div style={sectionHeaderStyle}>
                            <strong>Produtos da roleta</strong>
                            <span>{selectedIds.length} selecionado(s)</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '8px' }}>
                            <select
                                value={addProdutoId}
                                onChange={(event) => setAddProdutoId(event.target.value)}
                                style={inputStyle}
                            >
                                <option value="">Selecionar produto</option>
                                {availableProdutos.map((produto) => (
                                    <option key={produto.id} value={produto.id}>
                                        #{produto.id} {produto.nome}
                                    </option>
                                ))}
                            </select>
                            <button type="button" onClick={addProduto} style={secondaryButtonStyle}>
                                Adicionar
                            </button>
                        </div>

                        {selectedProdutos.length === 0 ? (
                            <div style={emptyStyle}>Nenhum produto selecionado para a roleta.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {selectedProdutos.map((produto, index) => {
                                    const produtoId = Number(produto.id);

                                    return (
                                        <article key={produto.id} style={productRowStyle}>
                                            <img src={getProdutoMainImage(produto)} alt={produto.nome} style={productImageStyle} />
                                            <div style={{ minWidth: 0 }}>
                                                <strong style={productNameStyle}>#{produto.id} {produto.nome}</strong>
                                                <span style={productMetaStyle}>
                                                    Tam. {produto.tamanho || 'Unico'} - {formatPrice(produto.precoVenda)}
                                                </span>
                                            </div>
                                            <div style={productActionsStyle}>
                                                <button type="button" disabled={index === 0} onClick={() => moveProduto(produtoId, -1)} style={iconButtonStyle} aria-label="Subir produto"><ArrowUp size={14} /></button>
                                                <button type="button" disabled={index === selectedProdutos.length - 1} onClick={() => moveProduto(produtoId, 1)} style={iconButtonStyle} aria-label="Descer produto"><ArrowDown size={14} /></button>
                                                <button type="button" onClick={() => removeProduto(produtoId)} style={{ ...iconButtonStyle, color: '#FF3B30', background: '#FFF1F0' }} aria-label="Remover produto"><Trash2 size={14} /></button>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {error && <div role="alert" style={errorStyle}>{error}</div>}
                    {success && <div role="status" style={successStyle}>{success}</div>}

                    <button type="submit" disabled={isSaving} style={primaryButtonStyle}>
                        <Save size={16} />
                        {isSaving ? 'Salvando...' : 'Salvar roleta'}
                    </button>
                </form>
            )}
        </div>
    );
}

const panelStyle: React.CSSProperties = {
    margin: '0 20px',
    padding: '24px',
    background: 'white',
    borderRadius: '24px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
};

const panelTitleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '0 0 20px',
    color: 'var(--dark)',
    fontSize: '18px',
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    minWidth: 0,
    padding: '13px',
    borderRadius: '12px',
    border: '1px solid #EEE',
    outline: 'none',
    background: '#F9F9F9',
    fontSize: '13px',
};

const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
};

const toggleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    color: 'var(--dark)',
    fontSize: '13px',
    fontWeight: 800,
};

const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    borderTop: '1px solid #EEE',
    paddingTop: '16px',
};

const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    color: '#999',
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
};

const emptyStyle: React.CSSProperties = {
    borderRadius: '14px',
    background: '#F9F9F9',
    color: '#777',
    fontSize: '13px',
    lineHeight: 1.4,
    padding: '18px',
    textAlign: 'center',
};

const secondaryButtonStyle: React.CSSProperties = {
    minHeight: '43px',
    border: 0,
    borderRadius: '12px',
    background: '#EDF7F0',
    color: '#687152',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 900,
    padding: '0 14px',
};

const productRowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '54px minmax(0, 1fr) auto',
    alignItems: 'center',
    gap: '10px',
    borderRadius: '14px',
    border: '1px solid #EEE',
    background: '#FDFDFD',
    padding: '10px',
};

const productImageStyle: React.CSSProperties = {
    width: '54px',
    height: '64px',
    borderRadius: '10px',
    objectFit: 'cover',
    background: '#EEE',
};

const productNameStyle: React.CSSProperties = {
    display: 'block',
    overflow: 'hidden',
    color: 'var(--dark)',
    fontSize: '12px',
    fontWeight: 900,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};

const productMetaStyle: React.CSSProperties = {
    display: 'block',
    color: '#777',
    fontSize: '11px',
    fontWeight: 700,
    marginTop: '3px',
};

const productActionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '5px',
};

const iconButtonStyle: React.CSSProperties = {
    display: 'grid',
    width: '28px',
    height: '28px',
    placeItems: 'center',
    border: 0,
    borderRadius: '8px',
    background: '#F4F4F4',
    color: '#333',
    cursor: 'pointer',
};

const errorStyle: React.CSSProperties = {
    padding: '11px 12px',
    borderRadius: '12px',
    color: '#A63D2F',
    background: '#FFF0ED',
    fontSize: '12px',
    fontWeight: 600,
};

const successStyle: React.CSSProperties = {
    padding: '11px 12px',
    borderRadius: '12px',
    color: '#2D6A4F',
    background: '#EDF7F0',
    fontSize: '12px',
    fontWeight: 600,
};

const primaryButtonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    minHeight: '48px',
    border: 0,
    borderRadius: '16px',
    background: '#687152',
    color: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 900,
};
