-- =================================================================
--          VIEW PARA EMPRÉSTIMOS ATIVOS
-- =================================================================
-- Descrição: Cria uma view materializada para consultar empréstimos
--            ativos, calculando dias corridos e juros acumulados
--            em tempo real para otimizar as consultas da aplicação.
-- =================================================================

CREATE OR REPLACE VIEW public.v_emprestimos_ativos AS
SELECT
    e1.id,
    e1.bucket_id AS credor_id,
    e1.conta_destino_id AS devedor_id,
    b1.user_id, -- Adicionado para filtros de dashboard
    e1.valor_brl AS valor_principal,
    e1.data AS data_emprestimo,
    e1.loan_id,
    e1.status_emprestimo,
    (CURRENT_DATE - e1.data) AS dias_corridos,
    b1.taxa_juros_diaria,
    b1.nome AS credor_nome,
    b2.nome AS devedor_nome,
    -- Cálculo de juros compostos diários
    (e1.valor_brl * (power(1 + (b1.taxa_juros_diaria / 100), (CURRENT_DATE - e1.data)) - 1)) AS juros_acumulados,
    (e1.valor_brl * power(1 + (b1.taxa_juros_diaria / 100), (CURRENT_DATE - e1.data))) AS valor_total_devido
FROM
    extratos e1
JOIN
    buckets b1 ON b1.id = e1.bucket_id
JOIN
    buckets b2 ON b2.id = e1.conta_destino_id
WHERE
    e1.transacao = 'saida_emprestimo' AND e1.status_emprestimo = 'ativo';

COMMENT ON VIEW public.v_emprestimos_ativos IS 'Visão consolidada de todos os empréstimos ativos com cálculo de juros em tempo real.';
