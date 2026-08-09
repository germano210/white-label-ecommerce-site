UPDATE roleta_premios
SET peso_interno = 1.00000000,
    titulo = CASE
        WHEN tipo_premio = 'DESCONTO_VALOR'
            THEN 'R$ ' || replace(to_char(valor, 'FM999999999990.00'), '.', ',') || ' OFF'
        WHEN tipo_premio = 'DESCONTO_PERCENTUAL'
            THEN replace(trim(trailing '.' from trim(trailing '0' from valor::text)), '.', ',') || '% OFF'
        ELSE titulo
    END,
    descricao = CASE
        WHEN tipo_premio IN ('DESCONTO_VALOR', 'DESCONTO_PERCENTUAL') THEN NULL
        ELSE descricao
    END,
    atualizado_em = now()
WHERE tipo_premio IN ('DESCONTO_VALOR', 'DESCONTO_PERCENTUAL');

UPDATE roleta_premios
SET ativo = false,
    peso_interno = 1.00000000,
    atualizado_em = now()
WHERE tipo_premio NOT IN ('DESCONTO_VALOR', 'DESCONTO_PERCENTUAL');
