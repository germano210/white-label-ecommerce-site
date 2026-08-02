ALTER TABLE produtos ADD COLUMN IF NOT EXISTS criado_em timestamp;

UPDATE produtos
SET criado_em = now()
WHERE criado_em IS NULL;

ALTER TABLE produtos ALTER COLUMN criado_em SET DEFAULT now();
ALTER TABLE produtos ALTER COLUMN criado_em SET NOT NULL;

CREATE TABLE IF NOT EXISTS produto_imagens (
    id bigserial PRIMARY KEY,
    produto_id bigint NOT NULL REFERENCES produtos(id),
    url varchar(255) NOT NULL,
    ordem integer NOT NULL DEFAULT 0,
    principal boolean NOT NULL DEFAULT false,
    criada_em timestamp NOT NULL DEFAULT now()
);

INSERT INTO produto_imagens (produto_id, url, ordem, principal, criada_em)
SELECT p.id, p.imagem_url, 0, true, p.criado_em
FROM produtos p
WHERE p.imagem_url IS NOT NULL
  AND trim(p.imagem_url) <> ''
  AND NOT EXISTS (
      SELECT 1
      FROM produto_imagens pi
      WHERE pi.produto_id = p.id
  );

CREATE INDEX IF NOT EXISTS idx_produto_imagens_produto
    ON produto_imagens (produto_id, ordem, id);
