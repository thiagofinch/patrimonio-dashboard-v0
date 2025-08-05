-- =================================================================
--          SCRIPT DE MIGRAÇÃO: ALOCAÇÃO DE CAPITAL
-- =================================================================
-- Descrição: Adiciona campos para a estrutura de capital nas tabelas
--            `buckets` e `extratos` para permitir a alocação
--            de capital como uma transação interna.
-- =================================================================

-- 1. ADICIONAR COLUNAS NA TABELA `buckets`
-- Adiciona colunas para rastrear o capital total e o capital operacional.
ALTER TABLE public.buckets
ADD COLUMN IF NOT EXISTS capital_total DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS capital_operacional DECIMAL(15,2);

COMMENT ON COLUMN public.buckets.capital_total IS 'Capital total inicial do bucket antes de qualquer alocação';
COMMENT ON COLUMN public.buckets.capital_operacional IS 'Capital não investido disponível para operações';


-- 2. ADICIONAR COLUNAS NA TABELA `extratos`
-- Adiciona colunas para registrar o contexto da alocação e um
-- flag booleano para identificar a transação.
ALTER TABLE public.extratos
ADD COLUMN IF NOT EXISTS saldo_anterior DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS saldo_final DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS capital_operacional DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS is_alocacao_inicial BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.extratos.saldo_anterior IS 'Saldo antes da transação (usado em alocações)';
COMMENT ON COLUMN public.extratos.saldo_final IS 'Saldo após a transação (usado em alocações)';
COMMENT ON COLUMN public.extratos.capital_operacional IS 'Capital operacional após alocação';
COMMENT ON COLUMN public.extratos.is_alocacao_inicial IS 'Flag para identificar a transação de alocação inicial de capital';
