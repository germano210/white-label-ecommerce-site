const defaultAdminRoute = '/rota-secreta-admin';

function normalizeRoute(route: string | undefined) {
    if (!route) return defaultAdminRoute;

    const trimmedRoute = route.trim();
    if (!trimmedRoute) return defaultAdminRoute;

    return trimmedRoute.startsWith('/') ? trimmedRoute : `/${trimmedRoute}`;
}

export const appRoutes = {
    root: '/',
    forYou: '/foryou',
    explorar: '/explorar',
    curtidas: '/curtidas/curtidas',
    resgate: '/curtidas/resgate',
    perfil: '/perfil',
    indique: '/indique',
    checkoutSuccess: '/checkout/sucesso',
    admin: normalizeRoute(import.meta.env.VITE_ADMIN_ROUTE),
} as const;
