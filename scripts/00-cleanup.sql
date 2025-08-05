-- =================================================================
--                  SCRIPT DE LIMPEZA (OPCIONAL, MAS RECOMENDADO)
-- =================================================================
-- Descrição: Remove as tabelas e tipos para garantir um recomeço limpo.
--            Execute este script primeiro se você já tentou criar as tabelas antes.
-- =================================================================

DROP TABLE IF EXISTS public.logs CASCADE;
DROP TABLE IF EXISTS public.extratos CASCADE;
DROP TABLE IF EXISTS public.buckets CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

DROP TYPE IF EXISTS public.bucket_categoria CASCADE;
DROP TYPE IF EXISTS public.bucket_tipo CASCADE;
DROP TYPE IF EXISTS public.bucket_liquidez CASCADE;
DROP TYPE IF EXISTS public.extrato_transacao CASCADE;
DROP TYPE IF EXISTS public.extrato_status CASCADE;
DROP TYPE IF EXISTS public.emprestimo_status CASCADE;
DROP TYPE IF EXISTS public.log_tipo CASCADE;
