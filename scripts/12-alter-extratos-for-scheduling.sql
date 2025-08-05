-- Adicionar campos necessários na tabela extratos
ALTER TABLE extratos
ADD COLUMN IF NOT EXISTS is_agendamento BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS agendamento_id UUID REFERENCES agendamentos(id) ON DELETE SET NULL;
