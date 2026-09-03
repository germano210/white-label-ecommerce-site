ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco_rua varchar(180);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco_numero varchar(30);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco_complemento varchar(120);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco_bairro varchar(100);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco_cidade varchar(100);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco_estado varchar(2);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS endereco_cep varchar(8);
