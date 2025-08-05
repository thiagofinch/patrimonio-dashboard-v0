-- =================================================================
--          DESABILITAR RLS PARA DESENVOLVIMENTO
-- =================================================================
-- Descrição: Este script desabilita a Row Level Security (RLS)
--            para as tabelas 'buckets' e 'extratos'. Isso é útil
--            durante o desenvolvimento para garantir que os dados
--            sejam sempre visíveis, contornando problemas de
--            autenticação ou políticas complexas.
--
-- AVISO:     Use isso apenas em ambiente de desenvolvimento.
--            RLS deve ser reativada em produção.
-- =================================================================

-- Desabilita a RLS para a tabela de buckets.
-- Todas as políticas associadas serão ignoradas.
ALTER TABLE public.buckets DISABLE ROW LEVEL SECURITY;

-- Desabilita a RLS para a tabela de extratos.
ALTER TABLE public.extratos DISABLE ROW LEVEL SECURITY;

-- Mensagem de confirmação (será exibida no Supabase SQL Editor)
SELECT 'RLS desabilitada com sucesso para as tabelas buckets e extratos.' as status;
