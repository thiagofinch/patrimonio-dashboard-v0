-- Drop existing tables if they exist to ensure a clean slate
DROP TABLE IF EXISTS agendamentos_execucoes CASCADE;
DROP TABLE IF EXISTS agendamentos CASCADE;

-- Recreate the agendamentos table with the correct schema
CREATE TABLE agendamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bucket_id TEXT NOT NULL, -- This column was missing or incorrect
    descricao TEXT NOT NULL,
    categoria TEXT,
    valor_brl DECIMAL(15,2) NOT NULL,
    valor_usd DECIMAL(15,2),
    dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
    tipo_recorrencia TEXT DEFAULT 'mensal',
    bucket_destino_id TEXT,
    ativo BOOLEAN DEFAULT true,
    data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    data_fim DATE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate the agendamentos_execucoes table with the correct foreign key reference
CREATE TABLE agendamentos_execucoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agendamento_id UUID NOT NULL REFERENCES agendamentos(id) ON DELETE CASCADE,
    data_prevista DATE NOT NULL,
    data_execucao TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pendente',
    transacao_id TEXT,
    valor_executado DECIMAL(15,2),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agendamento_id, data_prevista)
);

-- Add a comment to explain the purpose of this script
COMMENT ON TABLE agendamentos IS 'Stores recurring payment and transfer schedules for buckets.';
COMMENT ON TABLE agendamentos_execucoes IS 'Tracks the execution status of each scheduled event from the agendamentos table.';
