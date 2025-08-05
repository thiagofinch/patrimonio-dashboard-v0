-- =================================================================
--                  SCRIPT DE SEMEADURA (SEED) DE BUCKETS
-- =================================================================
-- Descrição: Insere os buckets iniciais com UUIDs válidos e o User ID do usuário.
-- =================================================================

INSERT INTO public.buckets (
  id, user_id, nome, icon, categoria, tipo, moeda_principal, capital_inicial_brl, capital_inicial_usd, data_capital_inicial, taxa_rendimento, taxa_emprestimo, liquidez, metadata
) VALUES
(
  '8c6317a6-1a23-4a72-83de-84356769a27c', '6b312ca6-f72f-4756-836c-e0e560062f43', 'Itaú Private', 'CheckCircle2', 'Investimentos Líquidos', 'investimento', 'BRL',
  25000.00, 4570.38, '2024-01-01', 0.00, 0.00, 'alta',
  '{"color": "#f59e0b", "institution": "Itaú"}'
),
(
  'f2b5e8a8-5b7c-4b6e-9f1d-3a2b1c8d7e6f', '6b312ca6-f72f-4756-836c-e0e560062f43', 'XP Investimentos', 'DollarSign', 'Investimentos Líquidos', 'investimento', 'BRL',
  15400.00, 2815.36, '2024-01-01', 0.00, 0.00, 'alta',
  '{"color": "#10b981", "institution": "XP Inc."}'
),
(
  'a1b2c3d4-5678-4e9a-b1c2-d3e4f5a6b7c8', '6b312ca6-f72f-4756-836c-e0e560062f43', 'Aplicação Ticto (Omegon)', 'TrendingUp', 'Investimentos Líquidos', 'aplicacao_empresa', 'BRL',
  11823260.35, 2161473.56, '2023-09-01', 1.54, 1.70, 'media',
  '{"color": "#8b5cf6", "institution": "Omegon"}'
),
(
  'd5e6f7a8-9b0c-4d1e-a2b3-c4d5e6f7a8b9', '6b312ca6-f72f-4756-836c-e0e560062f43', 'Investimentos BM (Clayson)', 'Zap', 'Investimentos Líquidos', 'investimento', 'BRL',
  15400.00, 2815.36, '2024-01-01', 1.54, 0.00, 'baixa',
  '{"color": "#ef4444", "institution": "BM Investimentos"}'
),
(
  'e9f0a1b2-c3d4-4e5f-a6b7-c8d9e0f1a2b3', '6b312ca6-f72f-4756-836c-e0e560062f43', 'Chase Física', 'Clock', 'Investimentos Líquidos', 'conta_internacional', 'USD',
  79470.44, 14528.42, '2024-01-01', 0.00, 0.00, 'alta',
  '{"color": "#3b82f6", "institution": "Chase Bank"}'
),
(
  'f4a5b6c7-d8e9-4f0a-b1c2-d3e4f5a6b7c8', '6b312ca6-f72f-4756-836c-e0e560062f43', 'Chase Investimentos', 'Folder', 'Investimentos Líquidos', 'investimento_internacional', 'USD',
  766140.03, 140062.16, '2024-01-01', 0.15, 0.00, 'media',
  '{"color": "#3b82f6", "institution": "Chase Bank"}'
),
(
  'a7b8c9d0-e1f2-4a3b-b4c5-d6e7f8a9b0c1', '6b312ca6-f72f-4756-836c-e0e560062f43', 'Chase Empresa', 'Building2', 'Investimentos Líquidos', 'conta_empresa', 'USD',
  183162.26, 33484.87, '2023-11-14', 0.00, 0.00, 'alta',
  '{"color": "#3b82f6", "institution": "Chase Bank"}'
),
(
  'b2c3d4e5-f6a7-4b8c-9d0e-f1a2b3c4d5e6', '6b312ca6-f72f-4756-836c-e0e560062f43', 'Empréstimo Camose', 'FileText', 'Empréstimos', 'emprestimo', 'BRL',
  136800.00, 25009.14, '2025-05-28', 0.00, 2.00, 'baixa',
  '{"color": "#ec4899"}'
),
(
  'c6d7e8f9-a0b1-4c2d-b3e4-f5a6b7c8d9e0', '6b312ca6-f72f-4756-836c-e0e560062f43', 'Participação Ticto', 'Users', 'Ativos Imobilizados', 'equity', 'BRL',
  38000000.00, 6946983.55, '2024-01-01', 0.00, 0.00, 'baixa',
  '{"color": "#6366f1", "institution": "Ticto"}'
),
(
  'd1e2f3a4-b5c6-4d7e-8f9a-0b1c2d3e4f5a', '6b312ca6-f72f-4756-836c-e0e560062f43', 'Carros', 'Briefcase', 'Ativos Imobilizados', 'ativo_fixo', 'BRL',
  2500000.00, 456946.98, '2024-01-01', 0.00, 0.00, 'baixa',
  '{"color": "#a855f7"}'
),
(
  'e5f6a7b8-c9d0-4e1f-a2b3-c4d5e6f7a8b9', '6b312ca6-f72f-4756-836c-e0e560062f43', 'Caução Chalon (RD)', 'Home', 'Ativos Imobilizados', 'ativo_fixo', 'BRL',
  1000000.00, 182778.79, '2024-01-01', 0.00, 0.00, 'baixa',
  '{"color": "#f97316"}'
),
(
  'f9a0b1c2-d3e4-4f5a-b6c7-d8e9f0a1b2c3', '6b312ca6-f72f-4756-836c-e0e560062f43', 'Saldo Amex (Kleysson)', 'CreditCard', 'Empréstimos', 'emprestimo', 'BRL',
  -100000.00, -18277.88, '2024-01-01', 0.00, 1.00, 'baixa',
  '{"color": "#d946ef"}'
)
ON CONFLICT (id) DO NOTHING;
