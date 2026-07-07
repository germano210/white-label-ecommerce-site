import { api } from './api';

const placeholderImagePath = '/placeholder-product.svg';

/**
 * Normaliza imagens vindas da API para evitar que caminhos relativos como
 * `/uploads/foto.jpg` sejam buscados na porta do Vite. URLs absolutas são
 * preservadas, caminhos relativos são concatenados ao host configurado no
 * Axios, e valores ausentes retornam um placeholder local estável.
 */
export function getImageUrl(path: string | undefined | null): string {
    if (!path) return placeholderImagePath;
    if (/^https?:\/\//i.test(path)) return path;

    const apiBaseUrl = String(api.defaults.baseURL ?? '').replace(/\/$/, '');
    return `${apiBaseUrl}/${path.replace(/^\/+/, '')}`;
}
