import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Gift, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { api } from '../../utils/api';
import { apiRoutes } from '../../utils/apiRoutes';
import { getImageUrl } from '../../utils/imageUtils';
import { brandPrimaryCssVar, brandPrimaryHex } from '../../constants/theme';

type RoletaTipoPremio = 'DESCONTO_VALOR' | 'DESCONTO_PERCENTUAL';

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

interface AdminRoletaOpcaoApi {
    id?: number | string | null;
    nivelId?: number | string | null;
    nivel_id?: number | string | null;
    nivel?: number | string | null;
    titulo?: string | null;
    descricao?: string | null;
    tipoPremio?: string | null;
    tipo_premio?: string | null;
    valor?: number | string | null;
    valorPremio?: number | string | null;
    valor_premio?: number | string | null;
    valorMinimo?: number | string | null;
    valor_minimo?: number | string | null;
    valorMaximo?: number | string | null;
    valor_maximo?: number | string | null;
    peso?: number | string | null;
    pesoInterno?: number | string | null;
    peso_interno?: number | string | null;
    ordem?: number | string | null;
    ativa?: boolean | number | string | null;
    ativo?: boolean | number | string | null;
}

interface AdminRoletaPremioApi extends AdminRoletaOpcaoApi {
    tipo?: string | null;
}

interface AdminRoletaNivelApi {
    id?: number | string | null;
    nome?: string | null;
    titulo?: string | null;
    descricao?: string | null;
    corHex?: string | null;
    cor_hex?: string | null;
    cor?: string | null;
    ordem?: number | string | null;
    pesoRelativo?: number | string | null;
    peso_relativo?: number | string | null;
    chanceCalculada?: number | string | null;
    chance_calculada?: number | string | null;
    ativa?: boolean | number | string | null;
    ativo?: boolean | number | string | null;
    premios?: AdminRoletaPremioApi[] | null;
    valores?: AdminRoletaPremioApi[] | null;
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
    multiplicadorDificuldadePadrao?: number | string | null;
    multiplicador_dificuldade_padrao?: number | string | null;
    produtoIds?: Array<number | string> | null;
    produto_ids?: Array<number | string> | null;
    selectedProdutoIds?: Array<number | string> | null;
    selected_produto_ids?: Array<number | string> | null;
    produtos?: ProdutoAdmin[] | null;
    niveis?: AdminRoletaNivelApi[] | null;
}

interface AdminRoletaMetaApi {
    id?: number | string | null;
    titulo?: string | null;
    descricao?: string | null;
    quantidadeAlvo?: number | string | null;
    quantidade_alvo?: number | string | null;
    progressoAtual?: number | string | null;
    progresso_atual?: number | string | null;
    girosRecompensa?: number | string | null;
    giros_recompensa?: number | string | null;
    ordem?: number | string | null;
    ativa?: boolean | number | string | null;
    ativo?: boolean | number | string | null;
    status?: string | null;
    criadaEm?: string | null;
    criada_em?: string | null;
    atualizadaEm?: string | null;
    atualizada_em?: string | null;
    iniciadaEm?: string | null;
    iniciada_em?: string | null;
    concluidaEm?: string | null;
    concluida_em?: string | null;
}

interface AdminRoletaMetasResponse {
    content?: AdminRoletaMetaApi[];
    metas?: AdminRoletaMetaApi[];
    data?: AdminRoletaMetaApi[];
    items?: AdminRoletaMetaApi[];
}

interface RoletaPrizeForm {
    localId: string;
    id?: number | string | null;
    nivelId?: number | string | null;
    tipoPremio: RoletaTipoPremio;
    valor: string;
    ordem: string;
    ativo: boolean;
}

interface RoletaLevelForm {
    localId: string;
    id?: number | string | null;
    nome: string;
    descricao: string;
    corHex: string;
    ordem: string;
    pesoRelativo: string;
    chanceCalculada?: number | null;
    ativo: boolean;
    premios: RoletaPrizeForm[];
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
    multiplicadorDificuldadePadrao: string;
    niveis: RoletaLevelForm[];
}

interface RoletaMetaForm {
    localId: string;
    id?: number | string | null;
    titulo: string;
    descricao: string;
    quantidadeAlvo: string;
    progressoAtual: number;
    girosRecompensa: string;
    ordem: string;
    ativa: boolean;
    status: string;
    criadaEm: string;
    atualizadaEm: string;
    iniciadaEm: string;
    concluidaEm: string;
}

interface RoletaMetaPayload {
    titulo: string;
    descricao: string | null;
    quantidadeAlvo: number;
    girosRecompensa: number;
    ordem: number;
    ativa: boolean;
}

interface RoletaNivelPayload {
    id?: number | string | null;
    nome: string;
    descricao?: string | null;
    corHex: string;
    ordem: number;
    pesoRelativo: string;
    ativo: boolean;
    premios: RoletaPremioPayload[];
}

interface RoletaPremioPayload {
    id?: number | string | null;
    nivelId?: number | string | null;
    tipoPremio: RoletaTipoPremio;
    valor: number;
    ordem: number;
    ativo: boolean;
}

const tipoPremioOptions: Array<{ value: RoletaTipoPremio; label: string }> = [
    { value: 'DESCONTO_VALOR', label: 'R$ desconto' },
    { value: 'DESCONTO_PERCENTUAL', label: '% desconto' },
];

const rarityPresets = [
    { nome: 'Grau Militar', corHex: '#2563EB' },
    { nome: 'Restrito', corHex: '#7C3AED' },
    { nome: 'Classificado', corHex: '#E83E8C' },
    { nome: 'Encoberto / Secreto', corHex: '#DC2626' },
    { nome: 'Extremamente Raro / Ouro', corHex: '#D4A017' },
];

let localIdCounter = 0;

function createLocalId(prefix: string) {
    localIdCounter += 1;
    return `${prefix}-${Date.now()}-${localIdCounter}`;
}

function parseNumber(value: number | string | null | undefined) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (value === null || value === undefined || value === '') return 0;

    return Number(String(value).replace(',', '.')) || 0;
}

function parseOptionalNumber(value: number | string | null | undefined) {
    if (value === null || value === undefined || value === '') return null;
    const parsedValue = parseNumber(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
}

function toPositiveInteger(value: string, fallback: number) {
    const parsedValue = Number(value);
    if (!Number.isFinite(parsedValue)) return fallback;
    return Math.max(0, Math.floor(parsedValue));
}

function toPositiveDecimal(value: string, fallback: number, minimum = 0) {
    const parsedValue = Number(value.replace(',', '.'));
    if (!Number.isFinite(parsedValue)) return fallback;
    return Math.max(minimum, parsedValue);
}

function isDecimalDraft(value: string) {
    return value === '' || /^\d*(?:[,.]\d*)?$/.test(value.trim());
}

function decimalInputValue(value: number | string | null | undefined, fallback = '') {
    if (value === null || value === undefined || value === '') return fallback;
    return String(value).replace(',', '.');
}

function decimalPayloadValue(value: string, fallback = '0') {
    const normalizedValue = value.trim().replace(',', '.');
    if (!normalizedValue) return fallback;

    const parsedValue = Number(normalizedValue);
    if (!Number.isFinite(parsedValue) || parsedValue < 0) return fallback;

    return normalizedValue;
}

function toBoolean(value: boolean | number | string | null | undefined, fallback = true) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const normalizedValue = value.trim().toLowerCase();
        if (normalizedValue === 'true' || normalizedValue === '1') return true;
        if (normalizedValue === 'false' || normalizedValue === '0') return false;
    }

    return fallback;
}

function normalizeHexColor(value: string | null | undefined, fallback: string) {
    const normalizedValue = value?.trim().replace(/^#/, '');

    if (normalizedValue && /^[0-9a-fA-F]{3}$/.test(normalizedValue)) {
        return `#${normalizedValue.split('').map((char) => `${char}${char}`).join('').toUpperCase()}`;
    }

    if (normalizedValue && /^[0-9a-fA-F]{6}$/.test(normalizedValue)) {
        return `#${normalizedValue.toUpperCase()}`;
    }

    return fallback;
}

function pickHexColor(values: Array<string | null | undefined>, fallback: string) {
    for (const value of values) {
        const normalizedValue = normalizeHexColor(value, '');
        if (normalizedValue) return normalizedValue;
    }

    return fallback;
}

function isHexColorDraft(value: string) {
    return /^#?[0-9a-fA-F]{0,6}$/.test(value.trim());
}

function isCompleteHexColor(value: string) {
    const normalizedValue = value.trim().replace(/^#/, '');
    return /^[0-9a-fA-F]{3}$/.test(normalizedValue) || /^[0-9a-fA-F]{6}$/.test(normalizedValue);
}

function normalizeTipoPremio(value: string | null | undefined): RoletaTipoPremio {
    const normalizedValue = value?.trim().toUpperCase();
    if (
        normalizedValue === 'DESCONTO_VALOR'
        || normalizedValue === 'DESCONTO_PERCENTUAL'
    ) {
        return normalizedValue;
    }

    return 'DESCONTO_VALOR';
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
        multiplicadorDificuldadePadrao: '5',
        niveis: [],
    };
}

function createBlankPrize(order: number): RoletaPrizeForm {
    return {
        localId: createLocalId('premio'),
        tipoPremio: 'DESCONTO_VALOR',
        valor: '0',
        ordem: String(order),
        ativo: true,
    };
}

function createBlankLevel(order: number, pesoRelativo: number | string): RoletaLevelForm {
    const preset = rarityPresets[(order - 1) % rarityPresets.length];

    return {
        localId: createLocalId('nivel'),
        nome: '',
        descricao: '',
        corHex: preset.corHex,
        ordem: String(order),
        pesoRelativo: decimalInputValue(pesoRelativo, '1'),
        chanceCalculada: null,
        ativo: true,
        premios: [],
    };
}

function createBlankMeta(order = 1): RoletaMetaForm {
    return {
        localId: createLocalId('meta'),
        titulo: '',
        descricao: '',
        quantidadeAlvo: '',
        progressoAtual: 0,
        girosRecompensa: '',
        ordem: String(order),
        ativa: true,
        status: 'ATIVA',
        criadaEm: '',
        atualizadaEm: '',
        iniciadaEm: '',
        concluidaEm: '',
    };
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

function formatChance(value: number | null | undefined) {
    if (value === null || value === undefined || !Number.isFinite(value)) return '--';

    const fractionDigits = Math.abs(value) < 1 ? 4 : 2;
    return `${value.toLocaleString('pt-BR', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    })}%`;
}

function normalizeIds(ids?: Array<number | string> | null) {
    return (ids ?? [])
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id));
}

function normalizeSelectedProductIds(
    roleta?: AdminRoletaResponse | null,
    fallback: number[] = [],
) {
    const rawIds = roleta?.produtoIds
        ?? roleta?.produto_ids
        ?? roleta?.selectedProdutoIds
        ?? roleta?.selected_produto_ids;

    if (rawIds) return normalizeIds(rawIds);
    if (roleta?.produtos) return normalizeIds(roleta.produtos.map((produto) => produto.id));

    return fallback;
}

function normalizePrizeFromApi(prize: AdminRoletaPremioApi, index: number): RoletaPrizeForm {
    const prizeValue = prize.valor
        ?? prize.valorPremio
        ?? prize.valor_premio
        ?? prize.valorMaximo
        ?? prize.valor_maximo
        ?? prize.valorMinimo
        ?? prize.valor_minimo
        ?? 0;

    return {
        localId: createLocalId('premio'),
        id: prize.id,
        nivelId: prize.nivelId ?? prize.nivel_id,
        tipoPremio: normalizeTipoPremio(prize.tipoPremio ?? prize.tipo_premio ?? prize.tipo),
        valor: String(prizeValue),
        ordem: String(prize.ordem ?? index + 1),
        ativo: toBoolean(prize.ativo ?? prize.ativa, true),
    };
}

function normalizeLevelsFromNestedApi(niveis: AdminRoletaNivelApi[]) {
    return niveis
        .map((nivel, index) => {
            const preset = rarityPresets[index % rarityPresets.length];
            const rawPremios = nivel.premios ?? nivel.valores ?? [];
            const ordem = Math.max(1, Math.floor(parseNumber(nivel.ordem ?? index + 1)));

            return {
                localId: createLocalId('nivel'),
                id: nivel.id,
                nome: nivel.nome ?? nivel.titulo ?? '',
                descricao: nivel.descricao ?? '',
                corHex: pickHexColor([nivel.corHex, nivel.cor_hex, nivel.cor], preset.corHex),
                ordem: String(ordem),
                pesoRelativo: decimalInputValue(nivel.pesoRelativo ?? nivel.peso_relativo, '1'),
                chanceCalculada: parseOptionalNumber(nivel.chanceCalculada ?? nivel.chance_calculada),
                ativo: toBoolean(nivel.ativo ?? nivel.ativa, true),
                premios: rawPremios.map(normalizePrizeFromApi),
            };
        })
        .sort((a, b) => toPositiveInteger(a.ordem, 0) - toPositiveInteger(b.ordem, 0));
}

function normalizeRoletaLevels(roleta?: AdminRoletaResponse | null) {
    if (roleta?.niveis?.length) {
        return normalizeLevelsFromNestedApi(roleta.niveis);
    }

    return [];
}

function normalizeMetaFromApi(meta: AdminRoletaMetaApi): RoletaMetaForm {
    const quantidadeAlvo = Math.max(0, Math.floor(parseNumber(
        meta.quantidadeAlvo ?? meta.quantidade_alvo,
    )));
    const rawProgress = Math.max(0, Math.floor(parseNumber(
        meta.progressoAtual ?? meta.progresso_atual,
    )));

    return {
        localId: createLocalId('meta'),
        id: meta.id,
        titulo: meta.titulo ?? '',
        descricao: meta.descricao ?? '',
        quantidadeAlvo: String(quantidadeAlvo || ''),
        progressoAtual: quantidadeAlvo > 0 ? Math.min(rawProgress, quantidadeAlvo) : rawProgress,
        girosRecompensa: String(Math.max(0, Math.floor(parseNumber(
            meta.girosRecompensa ?? meta.giros_recompensa,
        )))),
        ordem: String(Math.max(0, Math.floor(parseNumber(meta.ordem)))),
        ativa: toBoolean(meta.ativa ?? meta.ativo, true),
        status: meta.status?.trim() ?? '',
        criadaEm: meta.criadaEm ?? meta.criada_em ?? '',
        atualizadaEm: meta.atualizadaEm ?? meta.atualizada_em ?? '',
        iniciadaEm: meta.iniciadaEm ?? meta.iniciada_em ?? '',
        concluidaEm: meta.concluidaEm ?? meta.concluida_em ?? '',
    };
}

function normalizeMetasResponse(data: AdminRoletaMetaApi[] | AdminRoletaMetasResponse) {
    const metas = Array.isArray(data)
        ? data
        : data.content ?? data.metas ?? data.data ?? data.items ?? [];

    return metas.map(normalizeMetaFromApi);
}

function createFormFromRoleta(roleta?: AdminRoletaResponse | null): RoletaFormState {
    return {
        ativa: roleta?.ativa ?? true,
        titulo: roleta?.titulo ?? 'Brecho da Cami',
        metaGrupo: String(roleta?.metaGrupo ?? 20),
        girosBonusGrupo: String(roleta?.girosBonusGrupo ?? 2),
        girosIniciais: String(roleta?.girosIniciais ?? 8),
        giroDiarioQuantidade: String(roleta?.giroDiarioQuantidade ?? 1),
        giroDiarioSomenteQuandoZerar: roleta?.giroDiarioSomenteQuandoZerar ?? true,
        girosGanhosPorConvite: String(roleta?.girosGanhosPorConvite ?? 1),
        multiplicadorDificuldadePadrao: String(
            roleta?.multiplicadorDificuldadePadrao
            ?? roleta?.multiplicador_dificuldade_padrao
            ?? 5,
        ),
        niveis: normalizeRoletaLevels(roleta),
    };
}

function calculateLevelChances(levels: RoletaLevelForm[]) {
    const activeLevels = levels.filter((level) => level.ativo);
    const totalWeight = activeLevels.reduce((sum, level) => (
        sum + toPositiveDecimal(level.pesoRelativo, 0)
    ), 0);

    return levels.reduce<Record<string, number | null>>((acc, level) => {
        if (level.chanceCalculada !== null && level.chanceCalculada !== undefined) {
            acc[level.localId] = level.chanceCalculada;
            return acc;
        }

        if (!level.ativo || totalWeight <= 0) {
            acc[level.localId] = null;
            return acc;
        }

        acc[level.localId] = (toPositiveDecimal(level.pesoRelativo, 0) / totalWeight) * 100;
        return acc;
    }, {});
}

function createPayload(form: RoletaFormState, selectedIds: number[], atualizarProdutos: boolean) {
    const multiplier = toPositiveDecimal(form.multiplicadorDificuldadePadrao, 5, 1.01);
    const niveis: RoletaNivelPayload[] = form.niveis
        .map((level, levelIndex) => {
            const ordem = Math.max(1, toPositiveInteger(level.ordem, levelIndex + 1));
            const preset = rarityPresets[(ordem - 1) % rarityPresets.length];

            return {
                id: level.id,
                nome: level.nome.trim() || `Nivel ${ordem}`,
                corHex: normalizeHexColor(level.corHex, preset.corHex),
                ordem,
                pesoRelativo: decimalPayloadValue(level.pesoRelativo),
                ativo: level.ativo,
                premios: level.premios
                    .map((prize, prizeIndex) => {
                        const tipoPremio = prize.tipoPremio;
                        const value = toPositiveDecimal(prize.valor, 0);

                        return {
                            id: prize.id,
                            nivelId: prize.nivelId ?? level.id,
                            tipoPremio,
                            valor: value,
                            ordem: Math.max(1, toPositiveInteger(prize.ordem, prizeIndex + 1)),
                            ativo: prize.ativo,
                        };
                    })
                    .sort((a, b) => a.ordem - b.ordem),
            };
        })
        .sort((a, b) => a.ordem - b.ordem);

    const payload: {
        ativa: boolean;
        titulo: string;
        metaGrupo: number;
        girosBonusGrupo: number;
        girosIniciais: number;
        giroDiarioQuantidade: number;
        giroDiarioSomenteQuandoZerar: boolean;
        girosGanhosPorConvite: number;
        multiplicadorDificuldadePadrao: number;
        atualizarProdutos?: boolean;
        produtoIds?: number[];
        niveis: RoletaNivelPayload[];
    } = {
        ativa: form.ativa,
        titulo: form.titulo.trim(),
        metaGrupo: Math.max(1, toPositiveInteger(form.metaGrupo, 20)),
        girosBonusGrupo: toPositiveInteger(form.girosBonusGrupo, 2),
        girosIniciais: toPositiveInteger(form.girosIniciais, 8),
        giroDiarioQuantidade: toPositiveInteger(form.giroDiarioQuantidade, 1),
        giroDiarioSomenteQuandoZerar: form.giroDiarioSomenteQuandoZerar,
        girosGanhosPorConvite: toPositiveInteger(form.girosGanhosPorConvite, 1),
        multiplicadorDificuldadePadrao: multiplier,
        niveis,
    };

    if (atualizarProdutos) {
        payload.atualizarProdutos = true;
        payload.produtoIds = selectedIds;
    }

    return payload;
}

function getValidationError(form: RoletaFormState) {
    const activeLevels = form.niveis.filter((level) => level.ativo);
    const hasActivePrize = activeLevels.some((level) => (
        level.premios.some((prize) => prize.ativo)
    ));

    const hasInvalidLevelColor = form.niveis.some((level) => !isCompleteHexColor(level.corHex));

    if (hasInvalidLevelColor) {
        return 'Informe a cor do nivel em hexadecimal. Ex: #E83E8C.';
    }

    if (!hasActivePrize) {
        return 'Cadastre pelo menos um nivel ativo com premio ativo antes de salvar.';
    }

    const hasPrizeWithoutValue = activeLevels.some((level) => (
        level.premios.some((prize) => prize.ativo && toPositiveDecimal(prize.valor, 0) <= 0)
    ));

    if (hasPrizeWithoutValue) {
        return 'Todo premio ativo precisa ter valor maior que zero.';
    }

    const hasInvalidPercentualPrize = activeLevels.some((level) => (
        level.premios.some((prize) => (
            prize.ativo
            && prize.tipoPremio === 'DESCONTO_PERCENTUAL'
            && toPositiveDecimal(prize.valor, 0) > 100
        ))
    ));

    if (hasInvalidPercentualPrize) {
        return 'Premios percentuais precisam ter valor entre 1 e 100.';
    }

    return '';
}

function isMetaConcluida(meta: RoletaMetaForm) {
    return meta.status.trim().toUpperCase() === 'CONCLUIDA';
}

function formatMetaDate(value: string) {
    if (!value) return '--';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getMetaValidationError(meta: RoletaMetaForm) {
    const quantidadeAlvo = Math.floor(parseNumber(meta.quantidadeAlvo));
    const girosRecompensa = Math.floor(parseNumber(meta.girosRecompensa));

    if (!meta.titulo.trim()) {
        return 'Informe o titulo da meta.';
    }

    if (!Number.isFinite(quantidadeAlvo) || quantidadeAlvo <= 0) {
        return 'A quantidade alvo precisa ser maior que zero.';
    }

    if (!Number.isFinite(girosRecompensa) || girosRecompensa < 0) {
        return 'Os giros de recompensa precisam ser maior ou igual a zero.';
    }

    return '';
}

function createMetaPayload(meta: RoletaMetaForm): RoletaMetaPayload {
    return {
        titulo: meta.titulo.trim(),
        descricao: meta.descricao.trim() || null,
        quantidadeAlvo: Math.max(1, toPositiveInteger(meta.quantidadeAlvo, 1)),
        girosRecompensa: Math.max(0, toPositiveInteger(meta.girosRecompensa, 0)),
        ordem: Math.max(0, toPositiveInteger(meta.ordem, 0)),
        ativa: meta.ativa,
    };
}

export function RoletaAdminPanel() {
    const [form, setForm] = useState<RoletaFormState>(createDefaultForm);
    const [produtos, setProdutos] = useState<ProdutoAdmin[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [produtosAlterados, setProdutosAlterados] = useState(false);
    const [addProdutoId, setAddProdutoId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [metas, setMetas] = useState<RoletaMetaForm[]>([]);
    const [newMeta, setNewMeta] = useState<RoletaMetaForm>(() => createBlankMeta());
    const [isLoadingMetas, setIsLoadingMetas] = useState(false);
    const [metaActionId, setMetaActionId] = useState<string | null>(null);
    const [isCreatingMeta, setIsCreatingMeta] = useState(false);
    const [metaError, setMetaError] = useState('');
    const [metaSuccess, setMetaSuccess] = useState('');
    const [expandedLevelIds, setExpandedLevelIds] = useState<Record<string, boolean>>({});

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

    const levelChances = useMemo(() => (
        calculateLevelChances(form.niveis)
    ), [form.niveis]);

    const hasActiveLevelWithoutPrize = form.niveis.some((level) => (
        level.ativo && !level.premios.some((prize) => prize.ativo)
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
            setSelectedIds(normalizeSelectedProductIds(roleta));
            setProdutosAlterados(false);
            setForm(createFormFromRoleta(roleta));
        } catch {
            setError('Nao foi possivel carregar a configuracao da roleta.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadPanel();
    }, [loadPanel]);

    const loadMetas = useCallback(async (resetNewMeta = false) => {
        setIsLoadingMetas(true);
        setMetaError('');

        try {
            const { data } = await api.get<AdminRoletaMetaApi[] | AdminRoletaMetasResponse>(
                apiRoutes.admin.roletaMetas.list,
            );
            const nextMetas = normalizeMetasResponse(data);

            setMetas(nextMetas);
            setNewMeta((currentMeta) => {
                if (!resetNewMeta && (
                    currentMeta.id
                    || currentMeta.titulo
                    || currentMeta.quantidadeAlvo
                    || currentMeta.girosRecompensa
                )) {
                    return currentMeta;
                }

                const nextOrder = nextMetas.reduce((maxOrder, meta) => (
                    Math.max(maxOrder, toPositiveInteger(meta.ordem, 0))
                ), 0) + 1;

                return createBlankMeta(nextOrder);
            });
        } catch {
            setMetaError('Nao foi possivel carregar as metas da roleta.');
        } finally {
            setIsLoadingMetas(false);
        }
    }, []);

    useEffect(() => {
        void loadMetas();
    }, [loadMetas]);

    const updateForm = <K extends keyof RoletaFormState>(
        key: K,
        value: RoletaFormState[K],
    ) => {
        setForm((currentForm) => ({
            ...currentForm,
            [key]: value,
        }));
    };

    const updateLevel = <K extends keyof RoletaLevelForm>(
        levelLocalId: string,
        key: K,
        value: RoletaLevelForm[K],
    ) => {
        setForm((currentForm) => ({
            ...currentForm,
            niveis: currentForm.niveis.map((level) => (
                level.localId === levelLocalId
                    ? { ...level, [key]: value, chanceCalculada: null }
                    : level
            )),
        }));
    };

    const updatePrize = <K extends keyof RoletaPrizeForm>(
        levelLocalId: string,
        prizeLocalId: string,
        key: K,
        value: RoletaPrizeForm[K],
    ) => {
        setForm((currentForm) => ({
            ...currentForm,
            niveis: currentForm.niveis.map((level) => {
                if (level.localId !== levelLocalId) return level;

                return {
                    ...level,
                    premios: level.premios.map((prize) => (
                        prize.localId === prizeLocalId
                            ? { ...prize, [key]: value }
                            : prize
                    )),
                };
            }),
        }));
    };

    const addLevel = () => {
        setForm((currentForm) => {
            const multiplier = toPositiveDecimal(currentForm.multiplicadorDificuldadePadrao, 5, 1.01);
            const lastOrder = currentForm.niveis.reduce((maxOrder, level) => (
                Math.max(maxOrder, toPositiveInteger(level.ordem, 0))
            ), 0);
            const orderedLevels = [...currentForm.niveis].sort((a, b) => (
                toPositiveInteger(a.ordem, 0) - toPositiveInteger(b.ordem, 0)
            ));
            const lastLevel = orderedLevels[orderedLevels.length - 1];
            const lastWeight = lastLevel
                ? toPositiveDecimal(lastLevel.pesoRelativo, 1)
                : 1;
            const nextOrder = lastOrder + 1;
            const nextWeight = currentForm.niveis.length > 0
                ? Math.max(0.0001, lastWeight / multiplier)
                : lastWeight;
            const nextLevel = createBlankLevel(nextOrder, nextWeight);

            setExpandedLevelIds((currentIds) => ({
                ...currentIds,
                [nextLevel.localId]: true,
            }));

            return {
                ...currentForm,
                niveis: [...currentForm.niveis, nextLevel],
            };
        });
    };

    const removeLevel = (levelLocalId: string) => {
        setExpandedLevelIds((currentIds) => {
            const nextIds = { ...currentIds };
            delete nextIds[levelLocalId];
            return nextIds;
        });
        setForm((currentForm) => ({
            ...currentForm,
            niveis: currentForm.niveis.filter((level) => level.localId !== levelLocalId),
        }));
    };

    const toggleLevelDropdown = (levelLocalId: string) => {
        setExpandedLevelIds((currentIds) => ({
            ...currentIds,
            [levelLocalId]: !currentIds[levelLocalId],
        }));
    };

    const addPrize = (levelLocalId: string) => {
        setForm((currentForm) => ({
            ...currentForm,
            niveis: currentForm.niveis.map((level) => {
                if (level.localId !== levelLocalId) return level;

                const lastOrder = level.premios.reduce((maxOrder, prize) => (
                    Math.max(maxOrder, toPositiveInteger(prize.ordem, 0))
                ), 0);

                return {
                    ...level,
                    premios: [...level.premios, createBlankPrize(lastOrder + 1)],
                };
            }),
        }));
    };

    const removePrize = (levelLocalId: string, prizeLocalId: string) => {
        setForm((currentForm) => ({
            ...currentForm,
            niveis: currentForm.niveis.map((level) => {
                if (level.localId !== levelLocalId) return level;

                return {
                    ...level,
                    premios: level.premios.filter((prize) => prize.localId !== prizeLocalId),
                };
            }),
        }));
    };

    const addProduto = () => {
        const nextId = Number(addProdutoId);
        if (!Number.isFinite(nextId) || selectedIds.includes(nextId)) return;

        setSelectedIds((currentIds) => [...currentIds, nextId]);
        setProdutosAlterados(true);
        setAddProdutoId('');
    };

    const removeProduto = (produtoId: number) => {
        setSelectedIds((currentIds) => currentIds.filter((id) => id !== produtoId));
        setProdutosAlterados(true);
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

            setProdutosAlterados(true);
            return nextIds;
        });
    };

    const savePanel = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSaving(true);
        setError('');
        setSuccess('');

        const validationError = getValidationError(form);
        if (validationError) {
            setError(validationError);
            setIsSaving(false);
            return;
        }

        try {
            const { data } = await api.put<AdminRoletaResponse>(
                apiRoutes.admin.roleta,
                createPayload(form, selectedIds, produtosAlterados),
            );

            setSelectedIds((currentIds) => normalizeSelectedProductIds(data, currentIds));
            setProdutosAlterados(false);
            setForm(createFormFromRoleta(data));
            setSuccess('Roleta atualizada com sucesso.');
        } catch {
            setError('Nao foi possivel salvar a roleta. Confira os campos e tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    const updateNewMeta = <K extends keyof RoletaMetaForm>(
        key: K,
        value: RoletaMetaForm[K],
    ) => {
        setNewMeta((currentMeta) => ({
            ...currentMeta,
            [key]: value,
        }));
    };

    const updateMeta = <K extends keyof RoletaMetaForm>(
        metaLocalId: string,
        key: K,
        value: RoletaMetaForm[K],
    ) => {
        setMetas((currentMetas) => (
            currentMetas.map((meta) => (
                meta.localId === metaLocalId
                    ? { ...meta, [key]: value }
                    : meta
            ))
        ));
    };

    const createMeta = async () => {
        setMetaError('');
        setMetaSuccess('');

        const validationError = getMetaValidationError(newMeta);
        if (validationError) {
            setMetaError(validationError);
            return;
        }

        setIsCreatingMeta(true);

        try {
            await api.post<AdminRoletaMetaApi>(
                apiRoutes.admin.roletaMetas.create,
                createMetaPayload(newMeta),
            );
            await loadMetas(true);
            setMetaSuccess('Meta cadastrada com sucesso.');
        } catch {
            setMetaError('Nao foi possivel cadastrar a meta.');
        } finally {
            setIsCreatingMeta(false);
        }
    };

    const saveMeta = async (meta: RoletaMetaForm) => {
        if (meta.id === undefined || meta.id === null || meta.id === '') return;

        setMetaError('');
        setMetaSuccess('');

        const validationError = getMetaValidationError(meta);
        if (validationError) {
            setMetaError(validationError);
            return;
        }

        setMetaActionId(meta.localId);

        try {
            await api.put<AdminRoletaMetaApi>(
                apiRoutes.admin.roletaMetas.update(meta.id),
                createMetaPayload(meta),
            );
            await loadMetas();
            setMetaSuccess('Meta atualizada com sucesso.');
        } catch {
            setMetaError('Nao foi possivel atualizar a meta.');
        } finally {
            setMetaActionId(null);
        }
    };

    const deactivateMeta = async (meta: RoletaMetaForm) => {
        if (meta.id === undefined || meta.id === null || meta.id === '') return;

        setMetaError('');
        setMetaSuccess('');
        setMetaActionId(meta.localId);

        try {
            await api.delete<AdminRoletaMetaApi>(apiRoutes.admin.roletaMetas.delete(meta.id));
            await loadMetas();
            setMetaSuccess('Meta desativada com sucesso.');
        } catch {
            setMetaError('Nao foi possivel desativar a meta.');
        } finally {
            setMetaActionId(null);
        }
    };

    const resetMeta = async (meta: RoletaMetaForm) => {
        if (meta.id === undefined || meta.id === null || meta.id === '') return;
        if (!window.confirm('Reiniciar esta meta? O progresso atual sera zerado.')) return;

        setMetaError('');
        setMetaSuccess('');
        setMetaActionId(meta.localId);

        try {
            await api.post<AdminRoletaMetaApi>(apiRoutes.admin.roletaMetas.reset(meta.id));
            await loadMetas();
            setMetaSuccess('Meta reiniciada com sucesso.');
        } catch {
            setMetaError('Nao foi possivel reiniciar a meta.');
        } finally {
            setMetaActionId(null);
        }
    };

    return (
        <div style={panelStyle}>
            <h3 style={panelTitleStyle}>
                <Gift size={20} color={brandPrimaryCssVar} />
                Roleta VIP
            </h3>

            {isLoading ? (
                <div style={emptyStyle}>Carregando roleta...</div>
            ) : (
                <>
                <form onSubmit={savePanel} style={formStyle}>
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
                            <strong>Niveis da Roleta</strong>
                            <span>{form.niveis.length} nivel(is)</span>
                        </div>

                        <label style={fieldLabelStyle}>
                            Multiplicador de dificuldade padrao
                            <input
                                type="number"
                                min="1.01"
                                step="0.01"
                                value={form.multiplicadorDificuldadePadrao}
                                onChange={(event) => updateForm('multiplicadorDificuldadePadrao', event.target.value)}
                                style={inputStyle}
                            />
                        </label>

                        <p style={hintStyle}>
                            Cada novo nivel fica {form.multiplicadorDificuldadePadrao || '5'} vezes mais dificil que o anterior.
                        </p>

                        <p style={noticeStyle}>
                            As chances finais sao calculadas automaticamente a partir dos pesos dos niveis.
                        </p>

                        <button type="button" onClick={addLevel} style={secondaryButtonStyle}>
                            <Plus size={14} />
                            Adicionar nivel
                        </button>

                        {hasActiveLevelWithoutPrize && (
                            <div style={warningStyle}>
                                Existe nivel ativo sem premio ativo. Ele aparecera como alerta ate receber pelo menos um premio.
                            </div>
                        )}

                        {form.niveis.length === 0 ? (
                            <div style={emptyStyle}>Nenhum nível cadastrado.</div>
                        ) : (
                            <div style={levelsListStyle}>
                                {form.niveis
                                    .slice()
                                    .sort((a, b) => toPositiveInteger(a.ordem, 0) - toPositiveInteger(b.ordem, 0))
                                    .map((level) => {
                                        const hasActivePrize = level.premios.some((prize) => prize.ativo);
                                        const activePrizeCount = level.premios.filter((prize) => prize.ativo).length;
                                        const isExpanded = Boolean(expandedLevelIds[level.localId]);

                                        return (
                                            <article key={level.localId} style={levelCardStyle}>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleLevelDropdown(level.localId)}
                                                    style={levelDropdownTriggerStyle}
                                                    aria-expanded={isExpanded}
                                                >
                                                    <span
                                                        style={{ ...colorSwatchStyle, background: normalizeHexColor(level.corHex, brandPrimaryHex) }}
                                                        aria-hidden="true"
                                                    />
                                                    <div style={{ minWidth: 0 }}>
                                                        <strong style={levelNameStyle}>
                                                            {level.nome.trim() || `Nivel ${level.ordem}`}
                                                        </strong>
                                                        <span style={chanceStyle}>
                                                            Chance: {formatChance(levelChances[level.localId])} - Peso: {level.pesoRelativo || '0'} - Premios: {activePrizeCount}/{level.premios.length}
                                                        </span>
                                                    </div>
                                                    <span style={{
                                                        ...levelStatusPillStyle,
                                                        background: level.ativo ? '#EDF7F0' : '#F2F2F2',
                                                        color: level.ativo ? brandPrimaryCssVar : '#777',
                                                    }}>
                                                        {level.ativo ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                    <ChevronDown
                                                        size={16}
                                                        style={{
                                                            color: '#333',
                                                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                            transition: 'transform 0.2s ease',
                                                        }}
                                                    />
                                                </button>

                                                {isExpanded && (
                                                    <div style={levelDropdownContentStyle}>
                                                        <div style={levelDropdownActionsStyle}>
                                                            <label style={smallToggleStyle}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={level.ativo}
                                                                    onChange={(event) => updateLevel(level.localId, 'ativo', event.target.checked)}
                                                                />
                                                                Ativo
                                                            </label>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeLevel(level.localId)}
                                                                style={{ ...iconButtonStyle, color: '#FF3B30', background: '#FFF1F0' }}
                                                                aria-label="Remover nivel"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>

                                                        <div style={levelGridStyle}>
                                                            <label style={{ ...fieldLabelStyle, gridColumn: '1 / -1' }}>
                                                                Nome do nivel
                                                                <input
                                                                    value={level.nome}
                                                                    onChange={(event) => updateLevel(level.localId, 'nome', event.target.value)}
                                                                    placeholder="Ex: Grau Militar"
                                                                    style={inputStyle}
                                                                />
                                                            </label>
                                                            <label style={{ ...fieldLabelStyle, gridColumn: '1 / -1' }}>
                                                                Cor hexadecimal do nivel
                                                                <div style={colorFieldStyle}>
                                                                    <input
                                                                        type="color"
                                                                        value={normalizeHexColor(level.corHex, brandPrimaryHex)}
                                                                        onChange={(event) => updateLevel(level.localId, 'corHex', normalizeHexColor(event.target.value, brandPrimaryHex))}
                                                                        style={colorInputStyle}
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        inputMode="text"
                                                                        maxLength={7}
                                                                        value={level.corHex}
                                                                        onChange={(event) => {
                                                                            const nextValue = event.target.value.toUpperCase();
                                                                            if (isHexColorDraft(nextValue)) {
                                                                                updateLevel(level.localId, 'corHex', nextValue);
                                                                            }
                                                                        }}
                                                                        onBlur={() => {
                                                                            if (isCompleteHexColor(level.corHex)) {
                                                                                updateLevel(level.localId, 'corHex', normalizeHexColor(level.corHex, brandPrimaryHex));
                                                                            }
                                                                        }}
                                                                        placeholder="#E83E8C"
                                                                        style={colorTextInputStyle}
                                                                    />
                                                                </div>
                                                                <span style={fieldHintStyle}>
                                                                    Digite o hexadecimal exato e depois use Salvar roleta para gravar no backend.
                                                                </span>
                                                            </label>
                                                            <label style={fieldLabelStyle}>
                                                                Ordem
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={level.ordem}
                                                                    onChange={(event) => updateLevel(level.localId, 'ordem', event.target.value)}
                                                                    style={inputStyle}
                                                                />
                                                            </label>
                                                            <label style={fieldLabelStyle}>
                                                                Peso relativo
                                                                <input
                                                                    type="text"
                                                                    inputMode="decimal"
                                                                    step="0.00001"
                                                                    value={level.pesoRelativo}
                                                                    onChange={(event) => {
                                                                        const nextValue = event.target.value;
                                                                        if (isDecimalDraft(nextValue)) {
                                                                            updateLevel(level.localId, 'pesoRelativo', nextValue);
                                                                        }
                                                                    }}
                                                                    style={inputStyle}
                                                                />
                                                                <span style={fieldHintStyle}>
                                                                    Peso relativo define a chance. A chance calculada e somente leitura.
                                                                </span>
                                                            </label>
                                                            <label style={fieldLabelStyle}>
                                                                Chance calculada
                                                                <input
                                                                    value={formatChance(levelChances[level.localId])}
                                                                    readOnly
                                                                    style={{ ...inputStyle, background: '#F4F4F4', color: brandPrimaryCssVar }}
                                                                />
                                                            </label>
                                                        </div>

                                                        <textarea
                                                            value={level.descricao}
                                                            onChange={(event) => updateLevel(level.localId, 'descricao', event.target.value)}
                                                            placeholder="Descricao opcional do nivel"
                                                            style={textareaStyle}
                                                            rows={2}
                                                        />

                                                        {level.ativo && !hasActivePrize && (
                                                            <div style={warningStyle}>
                                                                Este nivel esta ativo, mas ainda nao possui premio ativo.
                                                            </div>
                                                        )}

                                                        <div style={prizeHeaderStyle}>
                                                            <strong>Premios do nivel</strong>
                                                            <button type="button" onClick={() => addPrize(level.localId)} style={miniButtonStyle}>
                                                                <Plus size={12} />
                                                                Adicionar valor
                                                            </button>
                                                        </div>

                                                        {level.premios.length === 0 ? (
                                                            <div style={emptyStyle}>Nenhum premio cadastrado neste nivel.</div>
                                                        ) : (
                                                            <div style={prizesListStyle}>
                                                                {level.premios
                                                                    .slice()
                                                                    .sort((a, b) => toPositiveInteger(a.ordem, 0) - toPositiveInteger(b.ordem, 0))
                                                                    .map((prize) => (
                                                                        <article key={prize.localId} style={prizeCardStyle}>
                                                                            <div style={prizeGridStyle}>
                                                                                <label style={fieldLabelStyle}>
                                                                                    Tipo
                                                                                    <select
                                                                                        value={prize.tipoPremio}
                                                                                        onChange={(event) => updatePrize(
                                                                                            level.localId,
                                                                                            prize.localId,
                                                                                            'tipoPremio',
                                                                                            event.target.value as RoletaTipoPremio,
                                                                                        )}
                                                                                        style={inputStyle}
                                                                                    >
                                                                                        {tipoPremioOptions.map((option) => (
                                                                                            <option key={option.value} value={option.value}>
                                                                                                {option.label}
                                                                                            </option>
                                                                                        ))}
                                                                                    </select>
                                                                                </label>
                                                                                <label style={fieldLabelStyle}>
                                                                                    Valor
                                                                                    <input
                                                                                        type="text"
                                                                                        inputMode="decimal"
                                                                                        step="0.01"
                                                                                        value={prize.valor}
                                                                                        onChange={(event) => {
                                                                                            const nextValue = event.target.value;
                                                                                            if (isDecimalDraft(nextValue)) {
                                                                                                updatePrize(level.localId, prize.localId, 'valor', nextValue);
                                                                                            }
                                                                                        }}
                                                                                        style={inputStyle}
                                                                                    />
                                                                                </label>
                                                                                <label style={fieldLabelStyle}>
                                                                                    Ordem
                                                                                    <input
                                                                                        type="number"
                                                                                        min="1"
                                                                                        value={prize.ordem}
                                                                                        onChange={(event) => updatePrize(level.localId, prize.localId, 'ordem', event.target.value)}
                                                                                        style={inputStyle}
                                                                                    />
                                                                                </label>
                                                                                <label style={smallToggleStyle}>
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={prize.ativo}
                                                                                        onChange={(event) => updatePrize(level.localId, prize.localId, 'ativo', event.target.checked)}
                                                                                    />
                                                                                    Ativo
                                                                                </label>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => removePrize(level.localId, prize.localId)}
                                                                                    style={dangerTextButtonStyle}
                                                                                >
                                                                                    Remover
                                                                                </button>
                                                                            </div>
                                                                        </article>
                                                                    ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </article>
                                        );
                                    })}
                            </div>
                        )}
                    </section>

                    <section style={sectionStyle}>
                        <div style={sectionHeaderStyle}>
                            <strong>Produtos da roleta</strong>
                            <span>{selectedIds.length} selecionado(s)</span>
                        </div>

                        <div style={selectRowStyle}>
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
                            <div style={productsListStyle}>
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

                <section style={metasSectionStyle}>
                    <div style={sectionHeaderStyle}>
                        <strong>Metas da roleta</strong>
                        <span>{metas.length} meta(s)</span>
                    </div>

                    <article style={metaCardStyle}>
                        <div style={metaHeaderStyle}>
                            <div>
                                <strong style={metaTitleStyle}>Nova meta</strong>
                                <span style={metaSubtitleStyle}>Criar meta configuravel para a roleta.</span>
                            </div>
                            <label style={smallToggleStyle}>
                                <input
                                    type="checkbox"
                                    checked={newMeta.ativa}
                                    onChange={(event) => updateNewMeta('ativa', event.target.checked)}
                                />
                                Ativa
                            </label>
                        </div>

                        <div style={metaGridStyle}>
                            <label style={{ ...fieldLabelStyle, gridColumn: '1 / -1' }}>
                                Titulo
                                <input
                                    value={newMeta.titulo}
                                    onChange={(event) => updateNewMeta('titulo', event.target.value)}
                                    placeholder="Ex: Meta atual do grupo"
                                    style={inputStyle}
                                />
                            </label>
                            <label style={{ ...fieldLabelStyle, gridColumn: '1 / -1' }}>
                                Descricao
                                <textarea
                                    value={newMeta.descricao}
                                    onChange={(event) => updateNewMeta('descricao', event.target.value)}
                                    placeholder="Descricao opcional"
                                    style={textareaStyle}
                                    rows={2}
                                />
                            </label>
                            <label style={fieldLabelStyle}>
                                Quantidade alvo
                                <input
                                    type="number"
                                    min="1"
                                    value={newMeta.quantidadeAlvo}
                                    onChange={(event) => updateNewMeta('quantidadeAlvo', event.target.value)}
                                    style={inputStyle}
                                />
                            </label>
                            <label style={fieldLabelStyle}>
                                Giros recompensa
                                <input
                                    type="number"
                                    min="0"
                                    value={newMeta.girosRecompensa}
                                    onChange={(event) => updateNewMeta('girosRecompensa', event.target.value)}
                                    style={inputStyle}
                                />
                            </label>
                            <label style={fieldLabelStyle}>
                                Ordem
                                <input
                                    type="number"
                                    min="0"
                                    value={newMeta.ordem}
                                    onChange={(event) => updateNewMeta('ordem', event.target.value)}
                                    style={inputStyle}
                                />
                            </label>
                        </div>

                        <button type="button" onClick={() => void createMeta()} disabled={isCreatingMeta} style={secondaryButtonStyle}>
                            <Plus size={14} />
                            {isCreatingMeta ? 'Criando...' : 'Adicionar meta'}
                        </button>
                    </article>

                    {isLoadingMetas ? (
                        <div style={emptyStyle}>Carregando metas...</div>
                    ) : metas.length === 0 ? (
                        <div style={emptyStyle}>Nenhuma meta cadastrada.</div>
                    ) : (
                        <div style={metaListStyle}>
                            {metas.map((meta) => {
                                const completed = isMetaConcluida(meta);
                                const isBusy = metaActionId === meta.localId;

                                return (
                                    <article key={meta.localId} style={metaCardStyle}>
                                        <div style={metaHeaderStyle}>
                                            <div style={{ minWidth: 0 }}>
                                                <strong style={metaTitleStyle}>{meta.titulo || 'Meta sem titulo'}</strong>
                                                <span style={metaSubtitleStyle}>
                                                    Status: {meta.status || '--'} - Progresso: {meta.progressoAtual}/{meta.quantidadeAlvo || '0'}
                                                </span>
                                            </div>
                                            <label style={smallToggleStyle}>
                                                <input
                                                    type="checkbox"
                                                    checked={meta.ativa}
                                                    onChange={(event) => updateMeta(meta.localId, 'ativa', event.target.checked)}
                                                />
                                                Ativa
                                            </label>
                                        </div>

                                        {completed && (
                                            <div style={noticeStyle}>
                                                Meta concluida: quantidade alvo e giros recompensa ficam bloqueados no front.
                                            </div>
                                        )}

                                        <div style={metaGridStyle}>
                                            <label style={{ ...fieldLabelStyle, gridColumn: '1 / -1' }}>
                                                Titulo
                                                <input
                                                    value={meta.titulo}
                                                    onChange={(event) => updateMeta(meta.localId, 'titulo', event.target.value)}
                                                    style={inputStyle}
                                                />
                                            </label>
                                            <label style={{ ...fieldLabelStyle, gridColumn: '1 / -1' }}>
                                                Descricao
                                                <textarea
                                                    value={meta.descricao}
                                                    onChange={(event) => updateMeta(meta.localId, 'descricao', event.target.value)}
                                                    style={textareaStyle}
                                                    rows={2}
                                                />
                                            </label>
                                            <label style={fieldLabelStyle}>
                                                Quantidade alvo
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={meta.quantidadeAlvo}
                                                    onChange={(event) => updateMeta(meta.localId, 'quantidadeAlvo', event.target.value)}
                                                    disabled={completed}
                                                    style={completed ? disabledInputStyle : inputStyle}
                                                />
                                            </label>
                                            <label style={fieldLabelStyle}>
                                                Giros recompensa
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={meta.girosRecompensa}
                                                    onChange={(event) => updateMeta(meta.localId, 'girosRecompensa', event.target.value)}
                                                    disabled={completed}
                                                    style={completed ? disabledInputStyle : inputStyle}
                                                />
                                            </label>
                                            <label style={fieldLabelStyle}>
                                                Ordem
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={meta.ordem}
                                                    onChange={(event) => updateMeta(meta.localId, 'ordem', event.target.value)}
                                                    style={inputStyle}
                                                />
                                            </label>
                                        </div>

                                        <div style={metaDatesGridStyle}>
                                            <span>Criada em: {formatMetaDate(meta.criadaEm)}</span>
                                            <span>Atualizada em: {formatMetaDate(meta.atualizadaEm)}</span>
                                            <span>Iniciada em: {formatMetaDate(meta.iniciadaEm)}</span>
                                            <span>Concluida em: {formatMetaDate(meta.concluidaEm)}</span>
                                        </div>

                                        <div style={metaActionsStyle}>
                                            <button
                                                type="button"
                                                onClick={() => void saveMeta(meta)}
                                                disabled={isBusy}
                                                style={miniButtonStyle}
                                            >
                                                <Save size={12} />
                                                {isBusy ? 'Salvando...' : 'Salvar'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void resetMeta(meta)}
                                                disabled={isBusy}
                                                style={miniButtonStyle}
                                            >
                                                <RefreshCw size={12} />
                                                Reiniciar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void deactivateMeta(meta)}
                                                disabled={isBusy}
                                                style={dangerTextButtonStyle}
                                            >
                                                Desativar
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}

                    {metaError && <div role="alert" style={errorStyle}>{metaError}</div>}
                    {metaSuccess && <div role="status" style={successStyle}>{metaSuccess}</div>}
                </section>
                </>
            )}
        </div>
    );
}

const panelStyle: CSSProperties = {
    margin: '0 20px',
    padding: '24px',
    background: 'white',
    borderRadius: '24px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
};

const panelTitleStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '0 0 20px',
    color: 'var(--dark)',
    fontSize: '18px',
};

const formStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
};

const inputStyle: CSSProperties = {
    width: '100%',
    minWidth: 0,
    padding: '13px',
    borderRadius: '12px',
    border: '1px solid #EEE',
    outline: 'none',
    background: '#F9F9F9',
    color: '#111',
    fontSize: '13px',
};

const disabledInputStyle: CSSProperties = {
    ...inputStyle,
    background: '#EFEFEF',
    color: '#999',
    cursor: 'not-allowed',
};

const textareaStyle: CSSProperties = {
    ...inputStyle,
    minHeight: '70px',
    resize: 'vertical',
};

const colorFieldStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
};

const colorInputStyle: CSSProperties = {
    flex: '0 0 48px',
    width: '48px',
    height: '43px',
    border: '1px solid #EEE',
    borderRadius: '12px',
    background: '#F9F9F9',
    cursor: 'pointer',
    padding: '4px',
};

const colorTextInputStyle: CSSProperties = {
    ...inputStyle,
    flex: '1 1 auto',
    minWidth: 0,
    width: 'auto',
    textTransform: 'uppercase',
};

const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
};

const toggleStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    color: 'var(--dark)',
    fontSize: '13px',
    fontWeight: 800,
};

const smallToggleStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    alignSelf: 'center',
    gap: '6px',
    color: '#333',
    fontSize: '11px',
    whiteSpace: 'nowrap',
};

const sectionStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    borderTop: '1px solid #EEE',
    paddingTop: '16px',
};

const metasSectionStyle: CSSProperties = {
    ...sectionStyle,
    marginTop: '18px',
};

const metaListStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
};

const metaCardStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    borderRadius: '18px',
    border: '1px solid #ECECEC',
    background: '#FDFDFD',
    padding: '14px',
};

const metaHeaderStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    alignItems: 'start',
    gap: '12px',
};

const metaTitleStyle: CSSProperties = {
    display: 'block',
    overflow: 'hidden',
    color: '#111',
    fontSize: '13px',
    fontWeight: 900,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};

const metaSubtitleStyle: CSSProperties = {
    display: 'block',
    color: '#777',
    fontSize: '11px',
    lineHeight: 1.35,
    marginTop: '3px',
};

const metaGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '10px',
};

const metaDatesGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '6px 10px',
    color: '#777',
    fontSize: '10px',
    lineHeight: 1.3,
};

const metaActionsStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
};

const sectionHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    color: '#999',
    fontSize: '11px',
    fontWeight: 800,
    textTransform: 'uppercase',
};

const fieldLabelStyle: CSSProperties = {
    display: 'flex',
    minWidth: 0,
    flexDirection: 'column',
    gap: '6px',
    color: '#555',
    fontSize: '11px',
};

const fieldHintStyle: CSSProperties = {
    color: '#777',
    fontSize: '10px',
    lineHeight: 1.3,
};

const hintStyle: CSSProperties = {
    margin: '-4px 0 0',
    color: '#777',
    fontSize: '12px',
    lineHeight: 1.35,
};

const noticeStyle: CSSProperties = {
    margin: 0,
    borderRadius: '12px',
    background: '#F5F7F1',
    color: brandPrimaryCssVar,
    fontSize: '12px',
    lineHeight: 1.35,
    padding: '11px 12px',
};

const warningStyle: CSSProperties = {
    borderRadius: '12px',
    background: '#FFF8E8',
    color: '#8A6400',
    fontSize: '12px',
    lineHeight: 1.35,
    padding: '10px 12px',
};

const emptyStyle: CSSProperties = {
    borderRadius: '14px',
    background: '#F9F9F9',
    color: '#777',
    fontSize: '13px',
    lineHeight: 1.4,
    padding: '18px',
    textAlign: 'center',
};

const secondaryButtonStyle: CSSProperties = {
    display: 'inline-flex',
    minHeight: '43px',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    border: 0,
    borderRadius: '12px',
    background: '#EDF7F0',
    color: brandPrimaryCssVar,
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 900,
    padding: '0 14px',
};

const miniButtonStyle: CSSProperties = {
    display: 'inline-flex',
    minHeight: '30px',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    border: 0,
    borderRadius: '9px',
    background: '#EDF7F0',
    color: brandPrimaryCssVar,
    cursor: 'pointer',
    fontSize: '11px',
    padding: '0 10px',
};

const levelsListStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
};

const levelCardStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    borderRadius: '18px',
    border: '1px solid #ECECEC',
    background: '#FDFDFD',
    padding: '0',
    overflow: 'hidden',
};

const levelDropdownTriggerStyle: CSSProperties = {
    display: 'grid',
    width: '100%',
    gridTemplateColumns: '20px minmax(0, 1fr) auto auto',
    alignItems: 'center',
    gap: '10px',
    border: 0,
    background: 'transparent',
    cursor: 'pointer',
    padding: '14px',
    textAlign: 'left',
};

const levelDropdownContentStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    borderTop: '1px solid #EFEFEF',
    padding: '14px',
};

const levelDropdownActionsStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
};

const levelStatusPillStyle: CSSProperties = {
    borderRadius: '999px',
    fontSize: '10px',
    fontWeight: 900,
    padding: '5px 8px',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
};

const colorSwatchStyle: CSSProperties = {
    width: '20px',
    height: '20px',
    borderRadius: '999px',
    boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.7)',
};

const levelNameStyle: CSSProperties = {
    display: 'block',
    overflow: 'hidden',
    color: '#111',
    fontSize: '13px',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};

const chanceStyle: CSSProperties = {
    display: 'block',
    color: brandPrimaryCssVar,
    fontSize: '11px',
    marginTop: '3px',
};

const levelGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '10px',
};

const prizeHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#333',
    fontSize: '12px',
};

const prizesListStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
};

const prizeCardStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    borderRadius: '14px',
    background: '#F6F6F6',
    padding: '12px',
};

const prizeGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr) 82px 82px 70px auto',
    gap: '9px',
};

const dangerTextButtonStyle: CSSProperties = {
    alignSelf: 'flex-start',
    border: 0,
    background: 'transparent',
    color: '#C4372D',
    cursor: 'pointer',
    fontSize: '11px',
    padding: '2px 0',
};

const selectRowStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: '8px',
};

const productsListStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
};

const productRowStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '54px minmax(0, 1fr) auto',
    alignItems: 'center',
    gap: '10px',
    borderRadius: '14px',
    border: '1px solid #EEE',
    background: '#FDFDFD',
    padding: '10px',
};

const productImageStyle: CSSProperties = {
    width: '54px',
    height: '64px',
    borderRadius: '10px',
    objectFit: 'cover',
    background: '#EEE',
};

const productNameStyle: CSSProperties = {
    display: 'block',
    overflow: 'hidden',
    color: 'var(--dark)',
    fontSize: '12px',
    fontWeight: 900,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};

const productMetaStyle: CSSProperties = {
    display: 'block',
    color: '#777',
    fontSize: '11px',
    fontWeight: 700,
    marginTop: '3px',
};

const productActionsStyle: CSSProperties = {
    display: 'flex',
    gap: '5px',
};

const iconButtonStyle: CSSProperties = {
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

const errorStyle: CSSProperties = {
    padding: '11px 12px',
    borderRadius: '12px',
    color: '#A63D2F',
    background: '#FFF0ED',
    fontSize: '12px',
    fontWeight: 600,
};

const successStyle: CSSProperties = {
    padding: '11px 12px',
    borderRadius: '12px',
    color: '#2D6A4F',
    background: '#EDF7F0',
    fontSize: '12px',
    fontWeight: 600,
};

const primaryButtonStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    minHeight: '48px',
    border: 0,
    borderRadius: '16px',
    background: brandPrimaryCssVar,
    color: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 900,
};
