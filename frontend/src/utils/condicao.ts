import { type CondicaoCasasDecimais } from '../store/useConfiguracoesStore';

export function parseCondicao(value: number | string | null | undefined) {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }

    if (typeof value !== 'string' || !value.trim()) return null;

    const parsedValue = Number(value.replace(',', '.'));
    return Number.isFinite(parsedValue) ? parsedValue : null;
}

export function formatCondicao(
    condicao: number | string | null | undefined,
    casasDecimais: CondicaoCasasDecimais,
) {
    const parsedCondicao = parseCondicao(condicao);
    if (parsedCondicao === null) return '';

    return parsedCondicao.toLocaleString('pt-BR', {
        minimumFractionDigits: casasDecimais,
        maximumFractionDigits: casasDecimais,
    });
}
