-- Zera o campo 'capital_investido' para o bucket 'Aplicação Ticto'.
-- Esta operação afeta apenas o valor de capital investido, preservando o histórico de transações.
-- O saldo atual será recalculado com base nas transações existentes a partir do capital inicial.

UPDATE public.buckets
SET 
  capital_investido = 0
WHERE 
  nome = 'Aplicação Ticto';
