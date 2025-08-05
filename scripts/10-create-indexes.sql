-- =================================================================
--          ÍNDICES PARA PERFORMANCE
-- =================================================================
-- Descrição: Adiciona índices na tabela `extratos` para otimizar
--            as consultas relacionadas a empréstimos e transações,
--            melhorando a performance da view e dos painéis.
-- =================================================================

CREATE INDEX IF NOT EXISTS idx_extratos_loan_status ON public.extratos(loan_id, status_emprestimo);
CREATE INDEX IF NOT EXISTS idx_extratos_transacao ON public.extratos(transacao);

COMMENT ON INDEX public.idx_extratos_loan_status IS 'Otimiza a busca por empréstimos específicos e seu status.';
COMMENT ON INDEX public.idx_extratos_transacao IS 'Acelera a filtragem por tipo de transação, como "saida_emprestimo".';
