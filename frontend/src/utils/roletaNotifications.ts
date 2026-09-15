export type RoletaNotificacaoApi = string | {
    id?: number | string | null;
    tipo?: string | null;
    texto?: string | null;
    criadoEm?: string | null;
    criado_em?: string | null;
    usuarioNome?: string | null;
    usuario_nome?: string | null;
    usuarioSecundarioNome?: string | null;
    usuario_secundario_nome?: string | null;
    nivelNome?: string | null;
    nivel_nome?: string | null;
    nivelCorHex?: string | null;
    nivel_cor_hex?: string | null;
    nomeRoupa?: string | null;
    nome_roupa?: string | null;
    nomeProduto?: string | null;
    nome_produto?: string | null;
    produtoNome?: string | null;
    produto_nome?: string | null;
    itemNome?: string | null;
    item_nome?: string | null;
    roupa?: {
        nome?: string | null;
    } | null;
    produto?: {
        nome?: string | null;
    } | null;
};

export interface RoletaNotificationView {
    id: string;
    tipo: string;
    texto: string;
    nivelNome: string;
    nivelCorHex: string;
    criadoEm: string;
    createdAtMs: number;
    sourceIndex: number;
}

function normalizeHexColor(value: string | null | undefined, fallback: string) {
    const normalizedValue = value?.trim().replace(/^#/, '').replace(/^0x/i, '');

    if (normalizedValue && /^[0-9a-fA-F]{3}$/.test(normalizedValue)) {
        return `#${normalizedValue.split('').map((char) => `${char}${char}`).join('').toUpperCase()}`;
    }

    if (normalizedValue && /^[0-9a-fA-F]{6}$/.test(normalizedValue)) {
        return `#${normalizedValue.toUpperCase()}`;
    }

    return fallback;
}

export function normalizeRoletaRarityText(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toUpperCase();
}

function normalizeRoletaNotification(
    notification: RoletaNotificacaoApi,
    index: number,
): RoletaNotificationView | null {
    if (typeof notification === 'string') {
        const text = notification.trim();
        return text
            ? {
                id: `notification-${index}-${text}`,
                tipo: '',
                texto: text,
                nivelNome: '',
                nivelCorHex: '',
                criadoEm: '',
                createdAtMs: 0,
                sourceIndex: index,
            }
            : null;
    }

    const tipo = notification.tipo?.trim().toUpperCase() ?? '';
    const createdAt = notification.criadoEm ?? notification.criado_em ?? '';
    const createdAtMs = createdAt ? new Date(createdAt).getTime() : 0;
    const directText = notification.texto?.trim();
    const userName = (
        notification.usuarioNome
        ?? notification.usuario_nome
        ?? 'Um membro'
    ).trim();
    const secondaryUserName = (
        notification.usuarioSecundarioNome
        ?? notification.usuario_secundario_nome
        ?? ''
    ).trim();
    const levelName = (
        notification.nivelNome
        ?? notification.nivel_nome
        ?? ''
    ).trim();
    const levelColor = normalizeHexColor(
        notification.nivelCorHex ?? notification.nivel_cor_hex,
        '',
    );
    const productName = (
        notification.nomeRoupa
        ?? notification.nome_roupa
        ?? notification.nomeProduto
        ?? notification.nome_produto
        ?? notification.produtoNome
        ?? notification.produto_nome
        ?? notification.itemNome
        ?? notification.item_nome
        ?? notification.roupa?.nome
        ?? notification.produto?.nome
        ?? ''
    ).trim();
    let text = directText ?? '';

    if (!text && tipo === 'RECEBER_PREMIO' && levelName) {
        text = `${userName} tirou ${levelName}`;
    }

    if (!text && productName) {
        text = `Um membro resgatou a ${productName}`;
    }

    if (!text && secondaryUserName) {
        text = `${userName} indicou ${secondaryUserName}`;
    }

    if (!text.trim()) return null;

    return {
        id: String(notification.id ?? `${tipo || 'notification'}-${index}-${text}`),
        tipo,
        texto: text.trim(),
        nivelNome: levelName,
        nivelCorHex: levelColor,
        criadoEm: createdAt,
        createdAtMs: Number.isFinite(createdAtMs) ? createdAtMs : 0,
        sourceIndex: index,
    };
}

export function sortRoletaNotificationsByNewest(notifications: RoletaNotificationView[]) {
    return [...notifications].sort((currentNotification, nextNotification) => {
        if (currentNotification.createdAtMs !== nextNotification.createdAtMs) {
            return nextNotification.createdAtMs - currentNotification.createdAtMs;
        }

        return currentNotification.sourceIndex - nextNotification.sourceIndex;
    });
}

export function normalizeRoletaNotifications(notifications: RoletaNotificacaoApi[] = []) {
    return sortRoletaNotificationsByNewest(
        notifications
            .map(normalizeRoletaNotification)
            .filter((notification): notification is RoletaNotificationView => Boolean(notification)),
    );
}
