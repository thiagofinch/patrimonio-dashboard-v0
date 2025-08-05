-- =================================================================
--          PASSO 1: ADICIONAR CAMPO DE TAXA CUSTOMIZADA
-- =================================================================
-- Descrição: Adiciona uma nova coluna 'taxa_emprestimo_custom' na
--            tabela 'extratos'. Esta coluna permitirá que cada
--            empréstimo tenha sua própria taxa de juros, que
--            sobrescreverá a taxa padrão do bucket.
-- =================================================================

ALTER TABLE public.extratos
ADD COLUMN taxa_emprestimo_custom DECIMAL(10, 2) DEFAULT NULL;
