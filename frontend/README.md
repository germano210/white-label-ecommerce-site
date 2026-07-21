# Brecho da Cami Frontend

Frontend Vite/React da vitrine gamificada mobile-first.

## Rotas

- `/` redireciona para `/foryou`
- `/foryou` abre a vitrine de swipe
- `/explorar` abre a tela Explorar
- `/curtidas/curtidas` abre curtidas em modo lista
- `/curtidas/resgate` abre curtidas em modo resgate
- `/perfil` abre o perfil do usuario
- `/indique` abre Indique e Ganhe
- `/rota-secreta-admin` abre o admin, ou o valor definido em `VITE_ADMIN_ROUTE`

Rotas desconhecidas voltam para `/foryou` e nunca abrem o admin.

## Ambiente

Use apenas URLs publicas em variaveis `VITE_*`, porque elas entram no bundle do navegador.

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_AUTH_MODE=jwt
VITE_ADMIN_ROUTE=/rota-secreta-admin
```

Em producao com API separada, use:

```env
VITE_API_BASE_URL=https://api.brechodacami.com
```

Em producao no mesmo dominio do frontend, deixe `VITE_API_BASE_URL` vazio e mantenha as chamadas em `/api/**`.

## Sessao

`VITE_AUTH_MODE=jwt` mantem compatibilidade temporaria com `Authorization: Bearer <token>`. Esse modo persiste o JWT via Zustand/localStorage e tem maior risco em caso de XSS.

`VITE_AUTH_MODE=cookie` usa `withCredentials: true`, nao injeta JWT no header e restaura a sessao por `GET /api/auth/me`. O backend precisa emitir cookie HttpOnly, Secure e SameSite adequado ao dominio.

O admin usa store/token separado do usuario comum.

## Checkout

O frontend nao confirma pagamento. Ele cria um checkout/pedido pendente no backend, redireciona para a URL do gateway e a tela `/checkout/sucesso` consulta o backend para obter o status real do pedido.

Nao guarde dados de cartao, secrets ou dados sensiveis de pagamento em `localStorage`, `sessionStorage` ou variaveis `VITE_*`.

## Deploy SPA

O arquivo `public/_redirects` configura fallback para `index.html` em hosts compativeis, permitindo F5 em rotas como `/perfil`, `/foryou` e `/curtidas/resgate`. Em hosts que nao leem `_redirects`, configure regra equivalente de rewrite para `index.html`.

## Validacao

```bash
npm run build
```
