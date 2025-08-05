-- =================================================================
--                  SCHEMA DO BANCO DE DADOS PATRIMÔNIO
-- =================================================================
-- Plataforma: PostgreSQL (para Supabase)
-- Descrição: Cria todas as tabelas, tipos e relações necessárias
--            para a aplicação de gestão de patrimônio.
-- =================================================================

-- 1. CRIAÇÃO DE TIPOS ENUMERADOS (ENUMS)
-- Isso garante a consistência dos dados para campos com valores predefinidos.

CREATE TYPE public.bucket_categoria AS ENUM (
  'Investimentos Líquidos',
  'Empréstimos',
  'Ativos Imobilizados',
  'Outros'
);

CREATE TYPE public.bucket_tipo AS ENUM (
  'conta_corrente',
  'investimento',
  'aplicacao_empresa',
  'conta_internacional',
  'investimento_internacional',
  'conta_empresa',
  'emprestimo',
  'equity',
  'ativo_fixo',
  'outro'
);

CREATE TYPE public.bucket_liquidez AS ENUM (
  'alta',
  'media',
  'baixa'
);

CREATE TYPE public.extrato_transacao AS ENUM (
  'entrada',
  'saida_despesa',
  'saida_emprestimo'
);

CREATE TYPE public.extrato_status AS ENUM (
  'Confirmado',
  'Pendente',
  'Inadimplente'
);

CREATE TYPE public.emprestimo_status AS ENUM (
  'ativo',
  'quitado'
);

CREATE TYPE public.log_tipo AS ENUM (
  'CREATE',
  'UPDATE',
  'DELETE',
  'TRANSFER',
  'PAYMENT',
  'SYSTEM'
);

-- 2. TABELA DE USUÁRIOS (PROFILES)
-- Armazena informações públicas dos usuários, vinculadas à tabela `auth.users` do Supabase.

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- 3. TABELA DE BUCKETS
-- Tabela central que armazena cada conta ou "bucket" de patrimônio.

CREATE TABLE IF NOT EXISTS public.buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Informações Principais
  nome TEXT NOT NULL,
  icon TEXT, -- Nome do ícone (ex: 'Landmark')
  categoria public.bucket_categoria NOT NULL,
  tipo public.bucket_tipo NOT NULL,
  
  -- Dados Estratégicos e Financeiros
  moeda_principal CHAR(3) NOT NULL DEFAULT 'BRL',
  capital_inicial_brl DECIMAL(15, 2) DEFAULT 0.00,
  capital_inicial_usd DECIMAL(15, 2) DEFAULT 0.00,
  data_capital_inicial DATE,
  capital_investido DECIMAL(15, 2),
  aportes_mensais DECIMAL(15, 2),
  periodo_meses INT,
  taxa_rendimento DECIMAL(5, 2), -- Percentual, ex: 1.20
  taxa_emprestimo DECIMAL(5, 2), -- Percentual, ex: 1.50
  
  -- Metadados e Status
  liquidez public.bucket_liquidez,
  status TEXT DEFAULT 'active',
  inadimplencia BOOLEAN DEFAULT FALSE,
  metadata JSONB, -- Para armazenar cor, instituição, etc.
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_user
      FOREIGN KEY(user_id) 
	  REFERENCES public.users(id)
	  ON DELETE CASCADE
);

-- 4. TABELA DE EXTRATOS (TRANSAÇÕES)
-- Armazena todas as movimentações financeiras dentro de cada bucket.

CREATE TABLE IF NOT EXISTS public.extratos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id UUID NOT NULL,
  
  -- Detalhes da Transação
  data DATE NOT NULL,
  transacao public.extrato_transacao NOT NULL,
  categoria TEXT,
  descricao TEXT NOT NULL,
  finalidade TEXT,
  
  -- Valores
  valor_brl DECIMAL(15, 2) NOT NULL,
  valor_usd DECIMAL(15, 2),
  
  -- Status e Flags
  status public.extrato_status NOT NULL DEFAULT 'Confirmado',
  is_rendimento BOOLEAN DEFAULT FALSE,
  
  -- Rastreamento de Empréstimos
  loan_id UUID, -- ID compartilhado entre a saída e a entrada de um empréstimo
  status_emprestimo public.emprestimo_status,
  
  -- Relações de Contrapartida (para transferências e empréstimos)
  conta_origem_id UUID,
  conta_destino_id UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_bucket
      FOREIGN KEY(bucket_id) 
	  REFERENCES public.buckets(id)
	  ON DELETE CASCADE,
  
  CONSTRAINT fk_conta_origem
      FOREIGN KEY(conta_origem_id) 
	  REFERENCES public.buckets(id)
	  ON DELETE SET NULL,

  CONSTRAINT fk_conta_destino
      FOREIGN KEY(conta_destino_id) 
	  REFERENCES public.buckets(id)
	  ON DELETE SET NULL
);

-- 5. TABELA DE LOGS ("O RAIO DA VERDADE")
-- Registra todas as ações importantes realizadas na plataforma para auditoria.

CREATE TABLE IF NOT EXISTS public.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type public.log_tipo NOT NULL,
  description TEXT NOT NULL,
  details JSONB, -- Para armazenar metadados da ação (ex: bucketId, valor)

  CONSTRAINT fk_user_log
      FOREIGN KEY(user_id) 
	  REFERENCES public.users(id)
	  ON DELETE CASCADE
);

-- 6. ÍNDICES PARA OTIMIZAÇÃO DE CONSULTAS
-- Acelera a busca por dados frequentemente filtrados.

CREATE INDEX IF NOT EXISTS idx_buckets_user_id ON public.buckets(user_id);
CREATE INDEX IF NOT EXISTS idx_extratos_bucket_id ON public.extratos(bucket_id);
CREATE INDEX IF NOT EXISTS idx_extratos_data ON public.extratos(data DESC);
CREATE INDEX IF NOT EXISTS idx_extratos_loan_id ON public.extratos(loan_id);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON public.logs(timestamp DESC);

-- 7. POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- Fundamental para garantir que um usuário só possa ver e modificar seus próprios dados.

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela `users`
DROP POLICY IF EXISTS "Usuários podem ver e atualizar seus próprios perfis" ON public.users;
CREATE POLICY "Usuários podem ver e atualizar seus próprios perfis"
  ON public.users FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Políticas para a tabela `buckets`
DROP POLICY IF EXISTS "Usuários podem gerenciar seus próprios buckets" ON public.buckets;
CREATE POLICY "Usuários podem gerenciar seus próprios buckets"
  ON public.buckets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas para a tabela `extratos`
DROP POLICY IF EXISTS "Usuários podem gerenciar extratos de seus buckets" ON public.extratos;
CREATE POLICY "Usuários podem gerenciar extratos de seus buckets"
  ON public.extratos FOR ALL
  USING (bucket_id IN (SELECT id FROM public.buckets WHERE user_id = auth.uid()))
  WITH CHECK (bucket_id IN (SELECT id FROM public.buckets WHERE user_id = auth.uid()));

-- Políticas para a tabela `logs`
DROP POLICY IF EXISTS "Usuários podem ver seus próprios logs" ON public.logs;
CREATE POLICY "Usuários podem ver seus próprios logs"
  ON public.logs FOR SELECT
  USING (auth.uid() = user_id);
