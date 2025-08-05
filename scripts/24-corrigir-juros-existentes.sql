-- Script para corrigir cálculos de juros em empréstimos existentes
-- Este script recalcula os juros usando a fórmula correta de juros compostos

-- Função para calcular juros compostos corretamente
CREATE OR REPLACE FUNCTION calcular_juros_compostos(
    principal DECIMAL,
    taxa_mensal DECIMAL,
    dias_corridos INTEGER
) RETURNS TABLE (
    juros_acumulados DECIMAL,
    total_a_receber DECIMAL
) AS $$
DECLARE
    meses DECIMAL;
    taxa_decimal DECIMAL;
    montante DECIMAL;
BEGIN
    -- Converter dias para meses (30 dias = 1 mês)
    meses := dias_corridos::DECIMAL / 30.0;
    
    -- Taxa em decimal (1.32% = 0.0132)
    taxa_decimal := taxa_mensal / 100.0;
    
    -- Fórmula de juros compostos: M = P * (1 + i)^n
    montante := principal * POWER(1 + taxa_decimal, meses);
    
    -- Retornar juros e total
    juros_acumulados := montante - principal;
    total_a_receber := montante;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Atualizar todos os empréstimos ativos com cálculo correto
DO $$
DECLARE
    emprestimo RECORD;
    dias_corridos INTEGER;
    taxa_emprestimo DECIMAL;
    calculo RECORD;
BEGIN
    -- Buscar todos os empréstimos ativos
    FOR emprestimo IN 
        SELECT * FROM extratos 
        WHERE loan_id IS NOT NULL 
        AND status_emprestimo = 'ativo'
    LOOP
        -- Calcular dias corridos
        dias_corridos := EXTRACT(DAY FROM (CURRENT_DATE - emprestimo.data::DATE));
        
        -- Usar taxa custom ou padrão
        taxa_emprestimo := COALESCE(emprestimo.taxa_emprestimo_custom, 1.32);
        
        -- Calcular juros corretos
        SELECT * INTO calculo FROM calcular_juros_compostos(
            emprestimo.valor_brl,
            taxa_emprestimo,
            dias_corridos
        );
        
        -- Atualizar registro com valores corretos
        UPDATE extratos 
        SET 
            juros_acumulados = calculo.juros_acumulados,
            total_a_receber = calculo.total_a_receber,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = emprestimo.id;
        
        -- Log do cálculo
        RAISE NOTICE 'Empréstimo % - Principal: %, Taxa: %%, Dias: %, Juros: %, Total: %',
            emprestimo.loan_id,
            emprestimo.valor_brl,
            taxa_emprestimo,
            dias_corridos,
            calculo.juros_acumulados,
            calculo.total_a_receber;
    END LOOP;
    
    RAISE NOTICE 'Correção de juros concluída!';
END;
$$;

-- Limpar função temporária
DROP FUNCTION calcular_juros_compostos(DECIMAL, DECIMAL, INTEGER);
