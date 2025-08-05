-- CUIDADO: Esta ação é destrutiva e irá apagar permanentemente todo o histórico de transações do bucket "Aplicação Ticto".
DO $$
DECLARE
    ticto_bucket_id UUID;
BEGIN
    -- Encontra o ID do bucket 'Aplicação Ticto'
    SELECT id INTO ticto_bucket_id FROM buckets WHERE nome = 'Aplicação Ticto' LIMIT 1;

    IF ticto_bucket_id IS NOT NULL THEN
        -- Passo 1: Apagar todas as transações associadas a este bucket.
        -- Esta ação é irreversível.
        DELETE FROM extratos WHERE bucket_id = ticto_bucket_id;

        -- Passo 2: Resetar os campos de capital do bucket para zero.
        UPDATE buckets
        SET
            capital_inicial_brl = 0,
            capital_investido = 0, -- Zera também este campo para consistência
            data_capital_inicial = NOW() -- Atualiza a data para refletir o reset
        WHERE id = ticto_bucket_id;

        RAISE NOTICE 'Bucket "Aplicação Ticto" (ID: %) foi resetado. Todas as suas transações foram apagadas e seu capital foi zerado.', ticto_bucket_id;
    ELSE
        RAISE WARNING 'Bucket "Aplicação Ticto" não encontrado. Nenhuma ação foi tomada.';
    END IF;
END $$;
