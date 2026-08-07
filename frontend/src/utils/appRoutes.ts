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
    resgates: '/curtidas/resgates',
    perfil: '/perfil',
    indique: '/indique',
    roletaVip: '/vip/roleta',
    checkoutSuccess: '/checkout/sucesso',
    admin: normalizeRoute(import.meta.env.VITE_ADMIN_ROUTE),
} as const;
