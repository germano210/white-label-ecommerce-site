import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import axios from 'axios';
import { Edit3, Plus, Save, Sparkles, Trash2, X } from 'lucide-react';
import { api } from '../../utils/api';
import { apiRoutes } from '../../utils/apiRoutes';
import {
    normalizeTipoAcaoMissao,
    tipoAcaoMissaoLabels,
    tiposAcaoMissao,
    type TipoAcaoMissao,
} from '../../utils/missaoTypes';

interface AdminMissao {
    id: string;
    titulo: string;
    icone: string;
    metaProgresso: number;
    tipoAcao: TipoAcaoMissao;
    valorBase: number;
    peso: number;
    ativa: boolean;
}

interface AdminMissaoApi {
    id: string | number;
    titulo: string;
    icone: string;
    metaProgresso?: number;
    meta_progresso?: number;
    tipoAcao?: string;
    tipo_acao?: string;
    valorBase?: number;
    valor_base?: number;
    peso?: number;
    ativa?: boolean;
}

interface MissaoPayload {
    titulo: string;
    icone: string;
    meta_progresso: number;
    tipo_acao: TipoAcaoMissao;
    valorBase: number;
    peso: number;
}

interface MissaoFormState {
    titulo: string;
    icone: string;
    metaProgresso: string;
    tipoAcao: TipoAcaoMissao;
    valorBase: string;
    peso: string;
}

const emptyFormState: MissaoFormState = {
    titulo: '',
    icone: 'heart',
    metaProgresso: '3',
    tipoAcao: 'CURTIR_ITEM',
    valorBase: '10',
    peso: '1',
};

function parsePositiveNumber(value: string | number | undefined, fallback: number) {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function normalizeMissao(missao: AdminMissaoApi): AdminMissao {
    return {
        id: String(missao.id),
        titulo: missao.titulo,
        icone: missao.icone,
        metaProgresso: parsePositiveNumber(
            missao.metaProgresso ?? missao.meta_progresso,
            1,
        ),
        tipoAcao: normalizeTipoAcaoMissao(missao.tipoAcao ?? missao.tipo_acao),
        valorBase: parsePositiveNumber(missao.valorBase ?? missao.valor_base, 10),
        peso: parsePositiveNumber(missao.peso, 1),
        ativa: missao.ativa ?? true,
    };
}

function createFormState(missao?: AdminMissao | null): MissaoFormState {
    if (!missao) return emptyFormState;

    return {
        titulo: missao.titulo,
        icone: missao.icone,
        metaProgresso: String(missao.metaProgresso),
        tipoAcao: missao.tipoAcao,
        valorBase: String(missao.valorBase),
        peso: String(missao.peso),
    };
}

function buildPayload(formState: MissaoFormState): MissaoPayload {
    return {
        titulo: formState.titulo.trim(),
        icone: formState.icone.trim(),
        meta_progresso: parsePositiveNumber(formState.metaProgresso, 1),
        tipo_acao: formState.tipoAcao,
        valorBase: parsePositiveNumber(formState.valorBase, 10),
        peso: parsePositiveNumber(formState.peso, 1),
    };
}

function getAdminMissionErrorMessage(error: unknown, fallback: string) {
    if (!axios.isAxiosError(error)) return fallback;

    if (error.response?.status === 401 || error.response?.status === 403) {
        return 'Sua sessão administrativa expirou ou não possui permissão para gerenciar missões. Faça login como ADMIN e tente novamente.';
    }

    return fallback;
}

export function MissoesAdminPanel() {
    const [missoes, setMissoes] = useState<AdminMissao[]>([]);
    const [editingMissao, setEditingMissao] = useState<AdminMissao | null>(null);
    const [formState, setFormState] = useState<MissaoFormState>(emptyFormState);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const rewardPreview = useMemo(() => (
        parsePositiveNumber(formState.valorBase, 10) * parsePositiveNumber(formState.peso, 1)
    ), [formState.peso, formState.valorBase]);

    const carregarMissoes = useCallback(async () => {
        setIsLoading(true);
        setError('');

        try {
            const { data } = await api.get<AdminMissaoApi[] | { content?: AdminMissaoApi[] }>(
                apiRoutes.admin.missoes.list,
            );
            const apiMissoes = Array.isArray(data) ? data : data.content ?? [];
            setMissoes(apiMissoes.map(normalizeMissao));
        } catch (loadError) {
            setError(getAdminMissionErrorMessage(
                loadError,
                'Não foi possível carregar as missões cadastradas.',
            ));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void carregarMissoes();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [carregarMissoes]);

    const abrirCriacao = () => {
        setEditingMissao(null);
        setFormState(emptyFormState);
        setError('');
        setSuccess('');
        setIsFormOpen(true);
    };

    const abrirEdicao = (missao: AdminMissao) => {
        setEditingMissao(missao);
        setFormState(createFormState(missao));
        setError('');
        setSuccess('');
        setIsFormOpen(true);
    };

    const fecharFormulario = () => {
        setIsFormOpen(false);
        setEditingMissao(null);
        setFormState(emptyFormState);
    };

    const salvarMissao = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!formState.titulo.trim()) {
            setError('Informe o título da missão.');
            return;
        }

        const payload = buildPayload(formState);

        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            if (editingMissao) {
                await api.put(apiRoutes.admin.missoes.update(editingMissao.id), payload);
                setSuccess('Missão atualizada com sucesso.');
            } else {
                await api.post(apiRoutes.admin.missoes.create, payload);
                setSuccess('Missão cadastrada com sucesso.');
            }

            fecharFormulario();
            await carregarMissoes();
        } catch (saveError) {
            setError(getAdminMissionErrorMessage(
                saveError,
                'Não foi possível salvar a missão. Confira os dados e tente novamente.',
            ));
        } finally {
            setIsSaving(false);
        }
    };

    const excluirMissao = async (missaoId: AdminMissao['id']) => {
        setError('');
        setSuccess('');

        try {
            await api.delete(apiRoutes.admin.missoes.delete(missaoId));
            setMissoes((currentMissoes) => (
                currentMissoes.filter((missao) => missao.id !== missaoId)
            ));
            setSuccess('Missão removida com sucesso.');
        } catch (deleteError) {
            setError(getAdminMissionErrorMessage(
                deleteError,
                'Não foi possível remover a missão.',
            ));
        }
    };

    return (
        <section style={panelStyle}>
            <div style={panelHeaderStyle}>
                <div>
                    <h3 style={panelTitleStyle}>
                        <Sparkles size={20} color="#687152" />
                        Missões
                    </h3>
                    <p style={panelDescriptionStyle}>
                        Configure metas e XP com escalonamento por dificuldade.
                    </p>
                </div>
                <button type="button" onClick={abrirCriacao} style={primaryButtonStyle}>
                    <Plus size={16} />
                    Nova missão
                </button>
            </div>

            {error && <div role="alert" style={errorStyle}>{error}</div>}
            {success && <div role="status" style={successStyle}>{success}</div>}

            {isLoading ? (
                <div style={emptyStateStyle}>Carregando missões...</div>
            ) : missoes.length === 0 ? (
                <div style={emptyStateStyle}>Nenhuma missão cadastrada.</div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={tableHeaderRowStyle}>
                                <th style={tableHeaderStyle}>Missão</th>
                                <th style={tableHeaderStyle}>Tipo</th>
                                <th style={tableHeaderStyle}>Meta</th>
                                <th style={tableHeaderStyle}>Base XP</th>
                                <th style={tableHeaderStyle}>Peso</th>
                                <th style={tableHeaderStyle}>Recompensa Total</th>
                                <th style={{ ...tableHeaderStyle, textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {missoes.map((missao) => (
                                <tr key={missao.id} style={tableRowStyle}>
                                    <td style={tableCellStyle}>
                                        <strong style={{ color: 'var(--dark)', fontSize: '13px' }}>
                                            {missao.titulo}
                                        </strong>
                                        <div style={{ color: '#999', fontSize: '11px', marginTop: '2px' }}>
                                            Ícone: {missao.icone}
                                        </div>
                                    </td>
                                    <td style={tableCellStyle}>
                                        {tipoAcaoMissaoLabels[missao.tipoAcao]}
                                    </td>
                                    <td style={tableCellStyle}>{missao.metaProgresso}</td>
                                    <td style={tableCellStyle}>{missao.valorBase} XP</td>
                                    <td style={tableCellStyle}>{missao.peso}x</td>
                                    <td style={{ ...tableCellStyle, fontWeight: 800, color: '#687152' }}>
                                        {missao.valorBase * missao.peso} XP
                                    </td>
                                    <td style={{ ...tableCellStyle, textAlign: 'right' }}>
                                        <div style={tableActionsStyle}>
                                            <button
                                                type="button"
                                                aria-label={`Editar ${missao.titulo}`}
                                                onClick={() => abrirEdicao(missao)}
                                                style={iconActionButtonStyle}
                                            >
                                                <Edit3 size={15} />
                                            </button>
                                            <button
                                                type="button"
                                                aria-label={`Excluir ${missao.titulo}`}
                                                onClick={() => void excluirMissao(missao.id)}
                                                style={{
                                                    ...iconActionButtonStyle,
                                                    color: '#FF3B30',
                                                    background: '#FFF1F0',
                                                }}
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {isFormOpen && (
                <MissaoFormModal
                    formState={formState}
                    isEditing={Boolean(editingMissao)}
                    isSaving={isSaving}
                    rewardPreview={rewardPreview}
                    onChange={setFormState}
                    onClose={fecharFormulario}
                    onSubmit={salvarMissao}
                />
            )}
        </section>
    );
}

interface MissaoFormModalProps {
    formState: MissaoFormState;
    isEditing: boolean;
    isSaving: boolean;
    rewardPreview: number;
    onChange: (formState: MissaoFormState) => void;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

/**
 * Formulário de Game Design da missão.
 * O valor base representa o XP bruto que a ação entrega, enquanto o peso atua
 * como multiplicador de dificuldade. Essa separação permite escalar recompensas
 * sem recriar missões: uma ação simples mantém peso 1, e missões mais difíceis
 * aumentam o peso até 5 para calcular `valorBase * peso`.
 */
function MissaoFormModal({
    formState,
    isEditing,
    isSaving,
    rewardPreview,
    onChange,
    onClose,
    onSubmit,
}: MissaoFormModalProps) {
    const updateField = <Field extends keyof MissaoFormState>(
        field: Field,
        value: MissaoFormState[Field],
    ) => {
        onChange({ ...formState, [field]: value });
    };

    return (
        <div style={modalOverlayStyle} role="dialog" aria-modal="true">
            <form onSubmit={onSubmit} style={modalCardStyle}>
                <div style={modalHeaderStyle}>
                    <h4 style={{ margin: 0, fontSize: '18px', color: 'var(--dark)' }}>
                        {isEditing ? 'Editar missão' : 'Nova missão'}
                    </h4>
                    <button type="button" onClick={onClose} style={closeButtonStyle}>
                        <X size={18} />
                    </button>
                </div>

                <div style={formGridStyle}>
                    <label style={fieldStyle}>
                        <span style={labelStyle}>Título da missão</span>
                        <input
                            value={formState.titulo}
                            onChange={(event) => updateField('titulo', event.target.value)}
                            placeholder="Curta 3 itens diferentes"
                            style={inputStyle}
                            required
                        />
                    </label>

                    <label style={fieldStyle}>
                        <span style={labelStyle}>Tipo da ação</span>
                        <select
                            value={formState.tipoAcao}
                            onChange={(event) => updateField(
                                'tipoAcao',
                                normalizeTipoAcaoMissao(event.target.value),
                            )}
                            style={inputStyle}
                        >
                            {tiposAcaoMissao.map((tipoAcao) => (
                                <option key={tipoAcao} value={tipoAcao}>
                                    {tipoAcaoMissaoLabels[tipoAcao]}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label style={fieldStyle}>
                        <span style={labelStyle}>Ícone</span>
                        <select
                            value={formState.icone}
                            onChange={(event) => updateField('icone', event.target.value)}
                            style={inputStyle}
                        >
                            <option value="heart">Coração</option>
                            <option value="sparkles">Brilho</option>
                            <option value="shopping-bag">Sacola</option>
                            <option value="star">Estrela</option>
                        </select>
                    </label>

                    <label style={fieldStyle}>
                        <span style={labelStyle}>Meta de progresso</span>
                        <input
                            type="number"
                            min="1"
                            value={formState.metaProgresso}
                            onChange={(event) => updateField('metaProgresso', event.target.value)}
                            style={inputStyle}
                            required
                        />
                    </label>
                </div>

                <div style={xpGridStyle}>
                    <label style={fieldStyle}>
                        <span style={labelStyle}>Valor Base do XP</span>
                        <input
                            type="number"
                            min="1"
                            value={formState.valorBase}
                            onChange={(event) => updateField('valorBase', event.target.value)}
                            placeholder="10"
                            style={inputStyle}
                            required
                        />
                    </label>

                    <label style={fieldStyle}>
                        <span style={labelStyle}>Peso da Missão</span>
                        <select
                            value={formState.peso}
                            onChange={(event) => updateField('peso', event.target.value)}
                            style={inputStyle}
                        >
                            <option value="1">1 - Fácil</option>
                            <option value="2">2 - Normal</option>
                            <option value="3">3 - Difícil</option>
                            <option value="4">4 - Muito difícil</option>
                            <option value="5">5 - Lendária</option>
                        </select>
                    </label>
                </div>

                <div style={rewardPreviewStyle}>
                    <span>Recompensa Total</span>
                    <strong>{rewardPreview} XP</strong>
                </div>

                <button type="submit" disabled={isSaving} style={{
                    ...submitButtonStyle,
                    cursor: isSaving ? 'wait' : 'pointer',
                    opacity: isSaving ? 0.65 : 1,
                }}>
                    <Save size={16} />
                    {isSaving ? 'Salvando...' : 'Salvar missão'}
                </button>
            </form>
        </div>
    );
}

const panelStyle: CSSProperties = {
    margin: '0 20px',
    background: 'white',
    borderRadius: '24px',
    padding: '24px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
};

const panelHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '18px',
};

const panelTitleStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: 0,
    color: 'var(--dark)',
    fontSize: '18px',
};

const panelDescriptionStyle: CSSProperties = {
    margin: '6px 0 0',
    color: '#777',
    fontSize: '12px',
};

const primaryButtonStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: 0,
    borderRadius: '14px',
    background: '#687152',
    color: 'white',
    padding: '12px 14px',
    fontSize: '12px',
    fontWeight: 800,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
};

const tableStyle: CSSProperties = {
    width: '100%',
    minWidth: '720px',
    borderCollapse: 'collapse',
};

const tableHeaderRowStyle: CSSProperties = {
    color: '#999',
    fontSize: '10px',
    textAlign: 'left',
    textTransform: 'uppercase',
};

const tableHeaderStyle: CSSProperties = {
    padding: '8px 10px',
    fontWeight: 800,
};

const tableRowStyle: CSSProperties = {
    borderTop: '1px solid #F0F0F0',
};

const tableCellStyle: CSSProperties = {
    padding: '12px 10px',
    color: '#555',
    fontSize: '12px',
    verticalAlign: 'middle',
};

const tableActionsStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
};

const iconActionButtonStyle: CSSProperties = {
    display: 'inline-grid',
    width: '34px',
    height: '34px',
    placeItems: 'center',
    border: 0,
    borderRadius: '10px',
    color: '#687152',
    background: '#F2F4EE',
    cursor: 'pointer',
};

const emptyStateStyle: CSSProperties = {
    padding: '28px',
    borderRadius: '16px',
    background: '#F9F9F9',
    color: '#999',
    fontSize: '13px',
    textAlign: 'center',
};

const errorStyle: CSSProperties = {
    marginBottom: '12px',
    padding: '11px 12px',
    borderRadius: '12px',
    color: '#A63D2F',
    background: '#FFF0ED',
    fontSize: '12px',
    fontWeight: 700,
};

const successStyle: CSSProperties = {
    marginBottom: '12px',
    padding: '11px 12px',
    borderRadius: '12px',
    color: '#2D6A4F',
    background: '#EDF7F0',
    fontSize: '12px',
    fontWeight: 700,
};

const modalOverlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 4000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '18px',
    background: 'rgba(20, 20, 20, 0.42)',
    backdropFilter: 'blur(8px)',
};

const modalCardStyle: CSSProperties = {
    width: 'min(100%, 420px)',
    maxHeight: 'calc(100dvh - 36px)',
    overflowY: 'auto',
    borderRadius: '24px',
    background: 'white',
    padding: '22px',
    boxShadow: '0 24px 52px rgba(0,0,0,0.22)',
};

const modalHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '18px',
};

const closeButtonStyle: CSSProperties = {
    display: 'grid',
    width: '34px',
    height: '34px',
    placeItems: 'center',
    border: 0,
    borderRadius: '10px',
    background: '#F5F5F5',
    color: '#555',
    cursor: 'pointer',
};

const formGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
};

const xpGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginTop: '12px',
};

const fieldStyle: CSSProperties = {
    display: 'flex',
    minWidth: 0,
    flexDirection: 'column',
    gap: '6px',
};

const labelStyle: CSSProperties = {
    color: '#777',
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
};

const inputStyle: CSSProperties = {
    width: '100%',
    minWidth: 0,
    border: '1px solid #EEE',
    borderRadius: '12px',
    background: '#F9F9F9',
    color: 'var(--dark)',
    font: 'inherit',
    fontSize: '13px',
    outline: 'none',
    padding: '12px',
};

const rewardPreviewStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '14px',
    borderRadius: '14px',
    background: '#F2F4EE',
    color: '#687152',
    padding: '13px 14px',
    fontSize: '13px',
    fontWeight: 800,
};

const submitButtonStyle: CSSProperties = {
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '16px',
    border: 0,
    borderRadius: '16px',
    background: '#687152',
    color: 'white',
    padding: '15px',
    fontSize: '14px',
    fontWeight: 800,
};
