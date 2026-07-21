# Producao segura

Este backend deve subir em producao com `SPRING_PROFILES_ACTIVE=prod`.

Variaveis obrigatorias:

- `DATABASE_URL`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `JWT_SECRET`
- `PAYMENT_WEBHOOK_SECRET`
- `PAYMENT_CHECKOUT_BASE_URL`

Variaveis recomendadas:

- `JWT_EXPIRATION_MINUTES`
- `FRONTEND_ORIGIN`
- `ADMIN_FRONTEND_ORIGIN`
- `PAYMENT_API_KEY`, quando houver integracao direta com gateway
- `ADMIN_EMAIL` e `ADMIN_PASSWORD`, apenas para seed inicial controlado

O profile `prod` usa `spring.jpa.hibernate.ddl-auto=validate`. A estrutura do banco deve ser aplicada previamente pelos scripts em `docs/scripts`, sem `DROP` e sem recriar tabelas.

O login de usuario comum continua por telefone e OTP. O login admin continua por email e senha.

Por enquanto a API segue usando `Authorization: Bearer` para interoperar com o frontend atual. Se o token ficar em `localStorage`, o risco principal e roubo por XSS; por isso o backend reforca CSP, CORS sem wildcard e headers de seguranca. A evolucao recomendada para producao madura e trocar para cookie `HttpOnly`, `Secure`, `SameSite=Lax` ou `Strict`; nesse caso, reativar CSRF para metodos inseguros e expor `GET /api/csrf`.

Pagamentos nunca devem ser confirmados pelo retorno do frontend. O fluxo correto e:

1. Backend cria `Pedido` e `Pagamento` em `AGUARDANDO_PAGAMENTO`.
2. Front redireciona para checkout hospedado pelo gateway.
3. Gateway chama `POST /api/pagamentos/webhook`.
4. Backend valida `X-Payment-Signature` com `PAYMENT_WEBHOOK_SECRET`.
5. Backend marca o pedido como `PAGO` apenas depois de webhook valido.
6. Webhook repetido e tratado como idempotente por `eventId` e `paymentId`.

O backend nao serve o frontend React neste modo. Rotas como `/foryou`, `/explorar`, `/curtidas/curtidas`, `/curtidas/resgate`, `/perfil`, `/indique` e `/rota-secreta-admin` pertencem ao hosting do React.
