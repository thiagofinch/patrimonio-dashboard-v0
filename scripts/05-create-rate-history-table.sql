-- =================================================================
--          TABELA PARA HISTÓRICO DE TAXAS DE JUROS
-- =================================================================
-- Descrição: Cria uma nova tabela para armazenar o histórico de
--            taxas de rendimento para cada bucket, permitindo
--            que as taxas mudem ao longo do tempo.
-- =================================================================

CREATE TABLE IF NOT EXISTS public.taxas_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id UUID NOT NULL,
  taxa DECIMAL(10, 4) NOT NULL, -- Maior precisão para taxas
  data_vigencia DATE NOT NULL,
  tipo_taxa TEXT NOT NULL DEFAULT 'rendimento', -- 'rendimento' ou 'emprestimo'

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_bucket_taxa
      FOREIGN KEY(bucket_id)
	  REFERENCES public.buckets(id)
	  ON DELETE CASCADE,
  
  -- Garante que não haja duas taxas do mesmo tipo para o mesmo bucket no mesmo dia
  CONSTRAINT unique_taxa_por_dia UNIQUE (bucket_id, tipo_taxa, data_vigencia)
);

-- Habilitar RLS para a nova tabela
ALTER TABLE public.taxas_historico ENABLE ROW LEVEL SECURITY;

-- Política de segurança para a nova tabela
DROP POLICY IF EXISTS "Usuários podem gerenciar taxas de seus próprios buckets" ON public.taxas_historico;
CREATE POLICY "Usuários podem gerenciar taxas de seus próprios buckets"
  ON public.taxas_historico FOR ALL
  USING (bucket_id IN (SELECT id FROM public.buckets WHERE user_id = auth.uid()))
  WITH CHECK (bucket_id IN (SELECT id FROM public.buckets WHERE user_id = auth.uid()));

-- Adicionar um comentário à tabela para documentação
COMMENT ON TABLE public.taxas_historico IS 'Armazena o histórico de taxas de juros (rendimento e empréstimo) para cada bucket, permitindo cálculos precisos com taxas variáveis.';
