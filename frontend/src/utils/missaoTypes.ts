export const tiposAcaoMissao = [
    'CURTIR_ITEM',
    'COMPARTILHAR_ITEM',
    'COMPRAR_ITEM',
    'USAR_TENTATIVA',
] as const;

export type TipoAcaoMissao = typeof tiposAcaoMissao[number];

export const tipoAcaoMissaoLabels: Record<TipoAcaoMissao, string> = {
    CURTIR_ITEM: 'Curtir itens',
    COMPARTILHAR_ITEM: 'Compartilhar itens',
    COMPRAR_ITEM: 'Comprar itens',
    USAR_TENTATIVA: 'Usar tentativas',
};

export function normalizeTipoAcaoMissao(value: string | null | undefined): TipoAcaoMissao {
    return tiposAcaoMissao.includes(value as TipoAcaoMissao)
        ? value as TipoAcaoMissao
        : 'CURTIR_ITEM';
}
