CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS usuarios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome varchar(150),
    email varchar(180) UNIQUE,
    password varchar(120),
    telefone varchar(15) UNIQUE,
    otp varchar(6),
    otp_expiracao timestamp,
    perfil_acesso varchar(30),
    xp integer DEFAULT 0,
    nivel integer DEFAULT 1,
    tentativas integer DEFAULT 0,
    data_criacao timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS produtos (
    id bigserial PRIMARY KEY,
    nome varchar(255) NOT NULL,
    detalhes varchar(255),
    imagem_url varchar(255),
    tamanho varchar(255),
    preco_venda numeric(12, 2) NOT NULL,
    preco_antigo numeric(12, 2),
    curtidas_count integer DEFAULT 0,
    passos_count integer DEFAULT 0,
    ativo boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS missoes (
    id bigserial PRIMARY KEY,
    titulo varchar(120) NOT NULL,
    descricao varchar(500),
    icone varchar(80) NOT NULL,
    meta_progresso integer NOT NULL,
    tipo_acao varchar(80) NOT NULL,
    ciclo varchar(20),
    valor_base integer NOT NULL,
    peso integer NOT NULL DEFAULT 1,
    tentativas_recompensa integer NOT NULL DEFAULT 0,
    ativa boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS curtidas (
    id bigserial PRIMARY KEY,
    usuario_id uuid NOT NULL REFERENCES usuarios(id),
    produto_id bigint NOT NULL REFERENCES produtos(id),
    data_curtida timestamp NOT NULL DEFAULT now(),
    CONSTRAINT uk_curtida_usuario_produto UNIQUE (usuario_id, produto_id)
);

CREATE TABLE IF NOT EXISTS passos (
    id bigserial PRIMARY KEY,
    usuario_id uuid NOT NULL REFERENCES usuarios(id),
    produto_id bigint NOT NULL REFERENCES produtos(id),
    data_passo timestamp NOT NULL DEFAULT now(),
    CONSTRAINT uk_passo_usuario_produto UNIQUE (usuario_id, produto_id)
);

CREATE TABLE IF NOT EXISTS usuario_missoes (
    id bigserial PRIMARY KEY,
    usuario_id uuid NOT NULL REFERENCES usuarios(id),
    missao_id bigint NOT NULL REFERENCES missoes(id),
    progresso_atual integer NOT NULL DEFAULT 0,
    concluida boolean NOT NULL DEFAULT false,
    recompensa_resgatada boolean NOT NULL DEFAULT false,
    xp_concedido integer NOT NULL DEFAULT 0,
    data_inicio timestamp NOT NULL DEFAULT now(),
    data_conclusao timestamp,
    data_atualizacao timestamp NOT NULL DEFAULT now(),
    CONSTRAINT uk_usuario_missao UNIQUE (usuario_id, missao_id)
);

CREATE TABLE IF NOT EXISTS usuario_missoes_semanais (
    id bigserial PRIMARY KEY,
    usuario_id uuid NOT NULL REFERENCES usuarios(id),
    missao_id bigint NOT NULL REFERENCES missoes(id),
    semana_inicio timestamp NOT NULL,
    semana_fim timestamp NOT NULL,
    progresso_atual integer NOT NULL DEFAULT 0,
    concluida boolean NOT NULL DEFAULT false,
    recompensa_resgatada boolean NOT NULL DEFAULT false,
    xp_concedido integer NOT NULL DEFAULT 0,
    tentativas_concedidas integer NOT NULL DEFAULT 0,
    data_inicio timestamp NOT NULL DEFAULT now(),
    data_conclusao timestamp,
    data_atualizacao timestamp NOT NULL DEFAULT now(),
    CONSTRAINT uk_usuario_missao_semana UNIQUE (usuario_id, missao_id, semana_inicio)
);

CREATE TABLE IF NOT EXISTS compartilhamentos_itens (
    id bigserial PRIMARY KEY,
    codigo varchar(40) NOT NULL UNIQUE,
    usuario_origem_id uuid NOT NULL REFERENCES usuarios(id),
    produto_id bigint NOT NULL REFERENCES produtos(id),
    data_criacao timestamp NOT NULL DEFAULT now(),
    ativo boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS compartilhamentos_aberturas (
    id bigserial PRIMARY KEY,
    compartilhamento_id bigint NOT NULL REFERENCES compartilhamentos_itens(id),
    usuario_visitante_id uuid NOT NULL REFERENCES usuarios(id),
    data_abertura timestamp NOT NULL DEFAULT now(),
    CONSTRAINT uk_compartilhamento_visitante UNIQUE (
        compartilhamento_id,
        usuario_visitante_id
    )
);

CREATE INDEX IF NOT EXISTS idx_curtidas_produto ON curtidas (produto_id);
CREATE INDEX IF NOT EXISTS idx_passos_produto ON passos (produto_id);
CREATE INDEX IF NOT EXISTS idx_missoes_ciclo_tipo ON missoes (ciclo, tipo_acao);
CREATE INDEX IF NOT EXISTS idx_usuario_missoes_usuario ON usuario_missoes (usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuario_missoes_semanais_usuario
    ON usuario_missoes_semanais (usuario_id, semana_inicio);
