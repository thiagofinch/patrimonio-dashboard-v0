-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bucket_id TEXT NOT NULL REFERENCES buckets(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    categoria TEXT,
    valor_brl DECIMAL(15, 2) NOT NULL,
    valor_usd DECIMAL(15, 2),
    dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
    tipo_recorrencia TEXT DEFAULT 'mensal' CHECK (tipo_recorrencia IN ('mensal', 'trimestral', 'semestral', 'anual')),
    bucket_destino_id TEXT REFERENCES buckets(id),
    ativo BOOLEAN DEFAULT true,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de controle de execução dos agendamentos
CREATE TABLE IF NOT EXISTS agendamentos_execucoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agendamento_id UUID NOT NULL REFERENCES agendamentos(id) ON DELETE CASCADE,
    data_prevista DATE NOT NULL,
    data_execucao TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'vencido', 'cancelado')),
    transacao_id TEXT REFERENCES extratos(id) ON DELETE SET NULL,
    valor_executado DECIMAL(15, 2),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agendamento_id, data_prevista)
);

-- Adicionar RLS (Row Level Security)
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos_execucoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON agendamentos FOR ALL
TO authenticated
USING (bucket_id IN (SELECT id FROM buckets WHERE user_id = auth.uid()));

CREATE POLICY "Allow all for authenticated users on execucoes" ON agendamentos_execucoes FOR ALL
TO authenticated
USING (agendamento_id IN (SELECT id FROM agendamentos WHERE bucket_id IN (SELECT id FROM buckets WHERE user_id = auth.uid())));
