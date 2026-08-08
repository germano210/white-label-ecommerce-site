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
    configuracoes: {
        publicas: '/api/configuracoes/publicas',
    },
    auth: {
        requestOtp: '/api/auth/request-otp',
        verifyOtp: '/api/auth/verify-otp',
        adminLogin: '/api/auth/admin/login',
        updateName: '/api/auth/atualizar-nome',
        me: '/api/auth/me',
    },
    usuarios: {
        me: '/api/usuarios/me',
    },
    checkout: {
        create: '/api/checkout',
        status: (pedidoId: RouteId) => `/api/checkout/${routeId(pedidoId)}/status`,
    },
    curtidas: {
        list: '/api/curtidas',
        create: (produtoId: RouteId) => `/api/curtidas/${routeId(produtoId)}`,
    },
    passos: {
        create: (produtoId: RouteId) => `/api/passos/${routeId(produtoId)}`,
    },
    compartilhamentos: {
        create: (produtoId: RouteId) => `/api/compartilhamentos/produtos/${routeId(produtoId)}`,
        open: (codigo: RouteId) => `/api/compartilhamentos/${routeId(codigo)}/abrir`,
    },
    roleta: {
        status: '/api/roleta',
        girar: '/api/roleta/girar',
        produtos: '/api/roleta/produtos',
        convites: '/api/roleta/convites',
    },
    admin: {
        configuracoes: '/api/admin/configuracoes',
        roleta: '/api/admin/roleta',
        produtos: {
            list: '/api/admin/produtos',
            create: '/api/admin/produtos',
            update: (id: RouteId) => `/api/admin/produtos/${routeId(id)}`,
            delete: (id: RouteId) => `/api/admin/produtos/${routeId(id)}`,
            setMainImage: (produtoId: RouteId, imagemId: RouteId) => (
                `/api/admin/produtos/${routeId(produtoId)}/imagens/${routeId(imagemId)}/principal`
            ),
            updateImageOrder: (produtoId: RouteId) => (
                `/api/admin/produtos/${routeId(produtoId)}/imagens/ordem`
            ),
        },
        missoes: {
            list: '/api/admin/missoes',
            create: '/api/admin/missoes',
            update: (id: RouteId) => `/api/admin/missoes/${routeId(id)}`,
            delete: (id: RouteId) => `/api/admin/missoes/${routeId(id)}`,
        },
    },
} as const;
