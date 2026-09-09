export interface IndicacaoLinkApiLike {
    codigo?: string | number | null;
    code?: string | number | null;
    codigoIndicacao?: string | number | null;
    codigo_indicacao?: string | number | null;
    codigoConvite?: string | number | null;
    codigo_convite?: string | number | null;
    conviteUrl?: string | null;
    convite_url?: string | null;
    urlConvite?: string | null;
    url_convite?: string | null;
    linkConvite?: string | null;
    link_convite?: string | null;
    urlIndicacao?: string | null;
    url_indicacao?: string | null;
    linkIndicacao?: string | null;
    link_indicacao?: string | null;
    url?: string | null;
    link?: string | null;
}

const pendingIndicationCodeStorageKey = 'brechodacami-pending-indication-code';
const legacyPendingRoletaInviteStorageKey = 'viabras-pending-roleta-invite-code';

function getBrowserOrigin() {
    return typeof window === 'undefined'
        ? 'https://brechodacami.com.br'
        : window.location.origin;
}

export function normalizeIndicationCode(value: string | number | null | undefined) {
    return String(value ?? '').trim();
}

export function buildIndicationUrl(code: string) {
    const url = new URL('/vip/roleta', getBrowserOrigin());
    url.searchParams.set('ref', code);

    return url.toString();
}

function getCodeFromUrl(rawUrl: string) {
    try {
        const url = new URL(rawUrl, getBrowserOrigin());
        return normalizeIndicationCode(url.searchParams.get('ref'));
    } catch {
        return '';
    }
}

export function normalizeIndicationLink(data?: IndicacaoLinkApiLike | null) {
    if (!data) return '';

    const code = normalizeIndicationCode(
        data.codigo
        ?? data.codigoIndicacao
        ?? data.codigo_indicacao
        ?? data.codigoConvite
        ?? data.codigo_convite
        ?? data.code,
    );

    if (code) return buildIndicationUrl(code);

    const rawUrl = normalizeIndicationCode(
        data.urlIndicacao
        ?? data.url_indicacao
        ?? data.linkIndicacao
        ?? data.link_indicacao
        ?? data.conviteUrl
        ?? data.convite_url
        ?? data.urlConvite
        ?? data.url_convite
        ?? data.linkConvite
        ?? data.link_convite
        ?? data.url
        ?? data.link,
    );

    const urlCode = getCodeFromUrl(rawUrl);
    return urlCode ? buildIndicationUrl(urlCode) : rawUrl;
}

export function getPendingIndicationCode() {
    if (typeof window === 'undefined') return '';

    const queryCode = normalizeIndicationCode(
        new URLSearchParams(window.location.search).get('ref'),
    );
    if (queryCode) return queryCode;

    const storedCode = normalizeIndicationCode(
        window.sessionStorage.getItem(pendingIndicationCodeStorageKey),
    );
    if (storedCode) return storedCode;

    return normalizeIndicationCode(
        window.sessionStorage.getItem(legacyPendingRoletaInviteStorageKey),
    );
}

export function storePendingIndicationCode(code: string) {
    if (typeof window === 'undefined') return;

    const normalizedCode = normalizeIndicationCode(code);
    if (!normalizedCode) return;

    window.sessionStorage.setItem(pendingIndicationCodeStorageKey, normalizedCode);
    window.sessionStorage.removeItem(legacyPendingRoletaInviteStorageKey);
}

export function clearPendingIndicationCode() {
    if (typeof window === 'undefined') return;

    window.sessionStorage.removeItem(pendingIndicationCodeStorageKey);
    window.sessionStorage.removeItem(legacyPendingRoletaInviteStorageKey);
}
