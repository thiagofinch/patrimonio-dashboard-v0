-- =================================================================
--                  CRIAR PERFIL DE USUÁRIO
-- =================================================================
-- Descrição: Insere o registro do usuário na tabela `public.users`
--            para satisfazer a chave estrangeira da tabela `buckets`.
--            Este passo é necessário antes de semear os buckets.
-- =================================================================

INSERT INTO public.users (id, username)
VALUES ('6b312ca6-f72f-4756-836c-e0e560062f43', 'default_user')
-- Se o usuário já existir por algum motivo, não faz nada.
ON CONFLICT (id) DO NOTHING;
