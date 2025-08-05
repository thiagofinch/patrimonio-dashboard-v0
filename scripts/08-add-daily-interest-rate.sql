-- =================================================================
--          ADICIONAR TAXA DE JUROS DIÁRIA
-- =================================================================
-- Descrição: Adiciona uma coluna gerada na tabela `buckets` para
--            calcular e armazenar a taxa de juros diária,
--            simplificando cálculos futuros.
-- =================================================================

-- Adiciona a coluna se ela não existir.
-- A taxa de empréstimo é considerada mensal (30 dias).
ALTER TABLE public.buckets
ADD COLUMN IF NOT EXISTS taxa_juros_diaria DECIMAL(18, 10)
GENERATED ALWAYS AS (COALESCE(taxa_emprestimo, 0) / 30) STORED;

COMMENT ON COLUMN public.buckets.taxa_juros_diaria IS 'Taxa de juros diária, calculada automaticamente a partir da taxa_emprestimo mensal.';
