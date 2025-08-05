CREATE OR REPLACE FUNCTION handle_rendimento_transfer(
    p_origem_id UUID,
    p_destino_id UUID,
    p_valor_brl NUMERIC,
    p_valor_usd NUMERIC,
    p_data DATE,
    p_descricao TEXT,
    p_finalidade TEXT,
    p_status TEXT,
    p_origem_nome TEXT,
    p_destino_nome TEXT
)
RETURNS VOID AS $$
DECLARE
    v_loan_id UUID := gen_random_uuid();
BEGIN
    -- 1. Cria a transação de ENTRADA visível no bucket de ORIGEM.
    -- A função processarSaldos no frontend irá identificar esta transação
    -- (entrada + is_rendimento + conta_destino_id) e não a somará ao saldo de origem.
    INSERT INTO extratos (
        id, bucket_id, data, transacao, categoria, descricao, finalidade,
        valor_brl, valor_usd, status, is_rendimento, conta_destino_id, visivel_extrato
    ) VALUES (
        gen_random_uuid(), p_origem_id, p_data, 'entrada', 'Rendimento', p_descricao || ' (enviado para ' || p_destino_nome || ')', p_finalidade,
        p_valor_brl, p_valor_usd, p_status, TRUE, p_destino_id, TRUE
    );

    -- 2. Cria o EMPRÉSTIMO "fantasma" no bucket de ORIGEM para rastreamento.
    -- Esta linha é INVISÍVEL no extrato, mas aparece no painel de empréstimos.
    INSERT INTO extratos (
        id, bucket_id, data, transacao, categoria, descricao, finalidade,
        valor_brl, valor_usd, status, is_rendimento, loan_id, status_emprestimo, conta_destino_id, visivel_extrato
    ) VALUES (
        gen_random_uuid(), p_origem_id, p_data, 'registro_emprestimo', 'Empréstimo Concedido',
        '[Sistema] Custo de oportunidade: ' || p_descricao, 'Rastreamento',
        p_valor_brl, p_valor_usd, 'Confirmado', FALSE, v_loan_id, 'ativo', p_destino_id, FALSE
    );

    -- 3. Cria a DÍVIDA/ENTRADA correspondente no bucket de DESTINO.
    -- Esta linha é uma ENTRADA padrão, VISÍVEL e afeta o saldo do bucket de destino.
    INSERT INTO extratos (
        id, bucket_id, data, transacao, categoria, descricao, finalidade,
        valor_brl, valor_usd, status, is_rendimento, loan_id, status_emprestimo, conta_origem_id, visivel_extrato
    ) VALUES (
        gen_random_uuid(), p_destino_id, p_data, 'entrada', 'Entrada de Rendimento',
        'Rendimento recebido de ' || p_origem_nome || ': ' || p_descricao, 'Empréstimo',
        p_valor_brl, p_valor_usd, 'Confirmado', FALSE, v_loan_id, 'ativo', p_origem_id, TRUE
    );

END;
$$ LANGUAGE plpgsql;
