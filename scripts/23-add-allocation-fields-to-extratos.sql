ALTER TABLE extratos
ADD COLUMN IF NOT EXISTS valor_alocado DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS percentual_alocado DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS capital_investido_anterior DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS capital_investido_novo DECIMAL(15, 2);
