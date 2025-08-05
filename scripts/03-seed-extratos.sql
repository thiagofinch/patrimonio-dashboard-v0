-- =================================================================
--                  SCRIPT DE SEMEADURA (SEED) DE EXTRATOS
-- =================================================================
-- Descrição: Insere as transações iniciais nos buckets corretos.
-- =================================================================

INSERT INTO public.extratos (id, bucket_id, data, transacao, categoria, descricao, valor_brl, valor_usd, status, finalidade, conta_destino_id)
VALUES
  -- Extratos para 'Aplicação Ticto (Omegon)'
  (gen_random_uuid(), 'a1b2c3d4-5678-4e9a-b1c2-d3e4f5a6b7c8', '2023-09-01', 'entrada', 'Rendimento', 'Rentabilidade de Aplicação', 763319.88, 152663.98, 'Confirmado', 'Empresa', NULL),
  (gen_random_uuid(), 'a1b2c3d4-5678-4e9a-b1c2-d3e4f5a6b7c8', '2024-09-30', 'saida_despesa', 'Movimentação', 'Dedução de Aplicação', 1500000.00, 300000.00, 'Confirmado', 'Lançamento Funnel Builder', NULL),
  (gen_random_uuid(), 'a1b2c3d4-5678-4e9a-b1c2-d3e4f5a6b7c8', '2025-05-30', 'saida_despesa', 'Movimentação', 'Dedução de Aplicação', 1100000.00, 220000.00, 'Confirmado', 'Pagamento Folha de Junho', NULL),

  -- Extratos para 'Itaú Private'
  (gen_random_uuid(), '8c6317a6-1a23-4a72-83de-84356769a27c', '2025-02-15', 'saida_despesa', 'Movimentação', 'Saque para pagamento de empréstimo', 25000.00, 5000.00, 'Confirmado', NULL, NULL),

  -- Extratos para 'Investimentos BM (Clayson)'
  (gen_random_uuid(), 'd5e6f7a8-9b0c-4d1e-a2b3-c4d5e6f7a8b9', '2025-04-30', 'entrada', 'Movimentação', 'Aumento de capital sobre Aplicação', 15400.00, 3080.00, 'Inadimplente', NULL, NULL),

  -- Extratos para 'Empréstimo Camose'
  (gen_random_uuid(), 'b2c3d4e5-f6a7-4b8c-9d0e-f1a2b3c4d5e6', '2025-05-28', 'saida_emprestimo', 'Empréstimo Concedido', 'Valor total emprestado para Camozzi', 180000.00, 36000.00, 'Confirmado', NULL, NULL),
  (gen_random_uuid(), 'b2c3d4e5-f6a7-4b8c-9d0e-f1a2b3c4d5e6', '2025-07-05', 'entrada', 'Pagamento de Parcela', 'Total de parcelas pagas até o momento', 43200.00, 8640.00, 'Confirmado', NULL, NULL)

ON CONFLICT (id) DO NOTHING;
