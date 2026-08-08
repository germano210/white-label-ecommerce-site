const defaultAdminRoute = '/rota-secreta-admin';

function normalizeRoute(route: string | undefined) {
    if (!route) return defaultAdminRoute;

    const trimmedRoute = route.trim();
    if (!trimmedRoute) return defaultAdminRoute;

    return trimmedRoute.startsWith('/') ? trimmedRoute : `/${trimmedRoute}`;
}

export const appRoutes = {
    root: '/',
    roletaVip: '/vip/roleta',
    checkoutSuccess: '/checkout/sucesso',
    admin: normalizeRoute(import.meta.env.VITE_ADMIN_ROUTE),
} as const;
