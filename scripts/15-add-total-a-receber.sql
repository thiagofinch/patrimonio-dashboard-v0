-- =================================================================
--          SCRIPT 15: ADICIONAR CÁLCULO DE TOTAL A RECEBER
-- =================================================================
-- Descrição: Adiciona uma coluna 'total_a_receber_emprestimos' na tabela 'buckets'
--            e cria uma função e um trigger para mantê-la atualizada automaticamente.
--            Este valor representa o total que um bucket tem a receber de empréstimos
--            ativos, incluindo juros acumulados.
-- =================================================================

-- 1. Adicionar a nova coluna à tabela de buckets, se ela não existir.
ALTER TABLE public.buckets
ADD COLUMN IF NOT EXISTS total_a_receber_emprestimos DECIMAL(15, 2) DEFAULT 0;

-- 2. Criar ou substituir a função que calcula o total a receber para um bucket específico.
--    Esta função utiliza a view 'v_emprestimos_ativos' para garantir consistência
--    no cálculo de juros.
CREATE OR REPLACE FUNCTION public.calcular_total_a_receber(p_bucket_id TEXT)
RETURNS DECIMAL AS $$
DECLARE
    total_due DECIMAL;
BEGIN
    SELECT COALESCE(SUM(valor_total_devido), 0)
    INTO total_due
    FROM public.v_emprestimos_ativos
    WHERE credor_id = p_bucket_id;

    RETURN total_due;
END;
$$ LANGUAGE plpgsql;

-- 3. Criar ou substituir a função que será executada pelo trigger.
CREATE OR REPLACE FUNCTION public.atualizar_total_a_receber_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_credor_id TEXT;
BEGIN
    -- Se a operação for em uma transação de empréstimo (saída ou pagamento),
    -- precisamos identificar o credor para atualizar seu total a receber.
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        IF NEW.transacao = 'saida_emprestimo' THEN
            v_credor_id := NEW.bucket_id;
        ELSIF NEW.loan_id IS NOT NULL THEN
            -- Para pagamentos, busca o credor original do empréstimo
            SELECT bucket_id INTO v_credor_id FROM public.extratos 
            WHERE loan_id = NEW.loan_id AND transacao = 'saida_emprestimo' LIMIT 1;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.transacao = 'saida_emprestimo' THEN
            v_credor_id := OLD.bucket_id;
        ELSIF OLD.loan_id IS NOT NULL THEN
            SELECT bucket_id INTO v_credor_id FROM public.extratos 
            WHERE loan_id = OLD.loan_id AND transacao = 'saida_emprestimo' LIMIT 1;
        END IF;
    END IF;

    -- Se um credor foi identificado, atualiza seu total a receber.
    IF v_credor_id IS NOT NULL THEN
        UPDATE public.buckets
        SET total_a_receber_emprestimos = public.calcular_total_a_receber(v_credor_id)
        WHERE id = v_credor_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 4. Aplicar o trigger à tabela 'extratos'.
--    O trigger será acionado após qualquer inserção, atualização ou exclusão.
DROP TRIGGER IF EXISTS trigger_atualizar_total_a_receber ON public.extratos;
CREATE TRIGGER trigger_atualizar_total_a_receber
AFTER INSERT OR UPDATE OR DELETE ON public.extratos
FOR EACH ROW EXECUTE FUNCTION public.atualizar_total_a_receber_trigger();

-- 5. (Opcional) Função para recalcular todos os buckets de uma vez.
--    Útil para popular os dados pela primeira vez ou para corrigir inconsistências.
CREATE OR REPLACE FUNCTION public.recalcular_todos_os_totais_a_receber()
RETURNS void AS $$
DECLARE
    b RECORD;
BEGIN
    FOR b IN SELECT id FROM public.buckets LOOP
        UPDATE public.buckets
        SET total_a_receber_emprestimos = public.calcular_total_a_receber(b.id)
        WHERE id = b.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Para executar o recálculo manual, descomente e rode a linha abaixo no seu editor SQL:
-- SELECT public.recalcular_todos_os_totais_a_receber();
