-- Função para gerar transações pendentes mensalmente
CREATE OR REPLACE FUNCTION gerar_transacoes_agendadas()
RETURNS void
SECURITY DEFINER
AS $$
DECLARE
    agendamento RECORD;
    execucao_existente RECORD;
    data_transacao DATE;
    novo_extrato_id UUID;
BEGIN
    FOR agendamento IN
        SELECT * FROM agendamentos WHERE ativo = true
    LOOP
        -- Calcula a data da transação para o mês corrente
        data_transacao := DATE_TRUNC('month', CURRENT_DATE)::DATE + (agendamento.dia_vencimento - 1);

        -- Se a data de vencimento já passou neste mês, calcula para o próximo mês
        IF data_transacao < CURRENT_DATE THEN
            data_transacao := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE + (agendamento.dia_vencimento - 1);
        END IF;

        -- Verifica se a data da transação está dentro do período de validade do agendamento
        IF data_transacao >= agendamento.data_inicio AND (agendamento.data_fim IS NULL OR data_transacao <= agendamento.data_fim) THEN
            -- Verifica se já existe uma execução para este agendamento nesta data
            SELECT * INTO execucao_existente
            FROM agendamentos_execucoes
            WHERE agendamento_id = agendamento.id AND data_prevista = data_transacao;

            IF NOT FOUND THEN
                -- Gera um UUID para o novo extrato
                novo_extrato_id := gen_random_uuid();

                -- Cria a transação pendente no extrato
                INSERT INTO extratos (
                    id, bucket_id, data, transacao, categoria, descricao,
                    valor_brl, valor_usd, status, is_agendamento, agendamento_id
                ) VALUES (
                    novo_extrato_id::text,
                    agendamento.bucket_id,
                    data_transacao,
                    'saida_despesa', -- Assumindo como despesa por padrão
                    agendamento.categoria,
                    agendamento.descricao || ' (Agendado)',
                    agendamento.valor_brl,
                    agendamento.valor_usd,
                    'Pendente',
                    true,
                    agendamento.id
                );

                -- Cria o registro de execução correspondente
                INSERT INTO agendamentos_execucoes (agendamento_id, data_prevista, status, transacao_id)
                VALUES (agendamento.id, data_transacao, 'pendente', novo_extrato_id::text);
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
