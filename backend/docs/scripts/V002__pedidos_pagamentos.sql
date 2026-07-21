CREATE TABLE IF NOT EXISTS pedidos (
    id bigserial PRIMARY KEY,
    usuario_id uuid NOT NULL REFERENCES usuarios(id),
    status varchar(40) NOT NULL,
    valor_total numeric(12, 2) NOT NULL DEFAULT 0,
    data_criacao timestamp NOT NULL DEFAULT now(),
    data_atualizacao timestamp NOT NULL DEFAULT now(),
    versao bigint
);

CREATE TABLE IF NOT EXISTS pedido_itens (
    id bigserial PRIMARY KEY,
    pedido_id bigint NOT NULL REFERENCES pedidos(id),
    produto_id bigint NOT NULL REFERENCES produtos(id),
    quantidade integer NOT NULL,
    preco_unitario numeric(12, 2) NOT NULL,
    subtotal numeric(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS pagamentos (
    id bigserial PRIMARY KEY,
    pedido_id bigint NOT NULL REFERENCES pedidos(id),
    provider varchar(80) NOT NULL,
    checkout_id varchar(120) NOT NULL UNIQUE,
    payment_id varchar(120) UNIQUE,
    event_id varchar(120) UNIQUE,
    status varchar(40) NOT NULL,
    valor numeric(12, 2) NOT NULL,
    data_criacao timestamp NOT NULL DEFAULT now(),
    data_atualizacao timestamp NOT NULL DEFAULT now(),
    versao bigint
);

CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos (usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido ON pedido_itens (pedido_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_pedido ON pagamentos (pedido_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_checkout ON pagamentos (checkout_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_payment ON pagamentos (payment_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_event ON pagamentos (event_id);
