type RouteId = string | number;

function routeId(value: RouteId) {
    return encodeURIComponent(String(value));
}

export const apiRoutes = {
    produtos: {
        list: '/api/produtos',
    },
    missoes: {
        list: '/api/missoes',
    },
    auth: {
        requestOtp: '/api/auth/request-otp',
        verifyOtp: '/api/auth/verify-otp',
        updateName: '/api/auth/atualizar-nome',
    },
    curtidas: {
        create: (produtoId: RouteId) => `/api/curtidas/${routeId(produtoId)}`,
    },
    admin: {
        produtos: {
            list: '/api/admin/produtos',
            create: '/api/admin/produtos',
            delete: (id: RouteId) => `/api/admin/produtos/${routeId(id)}`,
        },
        missoes: {
            list: '/api/admin/missoes',
            create: '/api/admin/missoes',
            update: (id: RouteId) => `/api/admin/missoes/${routeId(id)}`,
            delete: (id: RouteId) => `/api/admin/missoes/${routeId(id)}`,
        },
    },
} as const;
