-- =================================================================
--          FUNÇÃO (RPC) PARA REALIZAR PAGAMENTO DE EMPRÉSTIMO
-- =================================================================
-- Descrição: Esta função encapsula toda a lógica de pagamento de um
--            empréstimo em uma única transação atômica.
--
-- Parâmetros:
--   - p_loan_id: O ID do empréstimo original.
--   - p_valor_pagamento: O montante que está sendo pago.
--   - p_bucket_pagador_id: O ID do bucket que está efetuando o pagamento.
--   - p_tipo_pagamento: 'total', 'parcial' ou 'juros'.
--
-- Ações:
--   1. Identifica o credor e o devedor originais.
--   2. Cria uma transação de SAÍDA no bucket pagador.
--   3. Cria uma transação de ENTRADA no bucket credor.
--   4. Se o tipo de pagamento for 'total', atualiza o status do
--      empréstimo original para 'quitado'.
-- =================================================================

CREATE OR REPLACE FUNCTION public.realizar_pagamento_emprestimo(
  p_loan_id UUID,
  p_valor_pagamento DECIMAL,
  p_bucket_pagador_id UUID,
  p_tipo_pagamento TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com os privilégios do criador da função
AS $$
DECLARE
  v_credor_id UUID;
  v_devedor_id UUID;
  v_credor_nome TEXT;
  v_devedor_nome TEXT;
  v_taxa_cambio DECIMAL := 5.47; -- Taxa de câmbio fixa, pode ser ajustada
BEGIN
  -- 1. Encontrar os buckets de credor e devedor a partir do empréstimo original
  SELECT conta_origem_id, bucket_id INTO v_credor_id, v_devedor_id
  FROM public.extratos
  WHERE loan_id = p_loan_id AND transacao = 'entrada'
  LIMIT 1;

  -- Se não encontrar, lança um erro
  IF v_credor_id IS NULL OR v_devedor_id IS NULL THEN
    RAISE EXCEPTION 'Empréstimo original com ID % não encontrado.', p_loan_id;
  END IF;

  -- Obter nomes para a descrição
  SELECT nome INTO v_credor_nome FROM public.buckets WHERE id = v_credor_id;
  SELECT nome INTO v_devedor_nome FROM public.buckets WHERE id = v_devedor_id;

  -- 2. Inserir a transação de SAÍDA do pagamento no bucket pagador (que é o devedor)
  INSERT INTO public.extratos (
    bucket_id, data, transacao, categoria, descricao, finalidade,
    valor_brl, valor_usd, status, loan_id, conta_destino_id
  ) VALUES (
    p_bucket_pagador_id,
    NOW(),
    'saida_despesa',
    'Pagamento de Dívida',
    'Pagamento para ' || v_credor_nome,
    'Amortização de Dívida',
    p_valor_pagamento,
    p_valor_pagamento / v_taxa_cambio,
    'Confirmado',
    p_loan_id, -- Vincula este pagamento ao empréstimo original
    v_credor_id
  );

  -- 3. Inserir a transação de ENTRADA do pagamento no bucket do credor
  INSERT INTO public.extratos (
    bucket_id, data, transacao, categoria, descricao, finalidade,
    valor_brl, valor_usd, status, loan_id, conta_origem_id
  ) VALUES (
    v_credor_id,
    NOW(),
    'entrada',
    'Recebimento de Pagamento',
    'Recebimento de ' || v_devedor_nome,
    'Amortização de Dívida',
    p_valor_pagamento,
    p_valor_pagamento / v_taxa_cambio,
    'Confirmado',
    p_loan_id, -- Vincula este pagamento ao empréstimo original
    p_bucket_pagador_id
  );

  -- 4. Se o pagamento for total, marcar o empréstimo original como 'quitado'
  IF p_tipo_pagamento = 'total' THEN
    UPDATE public.extratos
    SET status_emprestimo = 'quitado'
    WHERE loan_id = p_loan_id;
  END IF;

END;
$$;
