/*
  # Debug: Verificar dados das cidades

  1. Verificação Completa
    - Verificar se tabela budget_iss_rates existe
    - Listar todos os dados da tabela
    - Verificar estrutura das colunas
    - Confirmar políticas RLS

  2. Correção de dados se necessário
    - Garantir que existem cidades ativas
    - Inserir dados se a tabela estiver vazia
    - Ativar todas as cidades inseridas
*/

-- 1. Verificar se a tabela existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'budget_iss_rates'
  ) THEN
    RAISE NOTICE '✅ Tabela budget_iss_rates existe';
  ELSE
    RAISE NOTICE '❌ Tabela budget_iss_rates NÃO existe';
  END IF;
END $$;

-- 2. Verificar estrutura da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'budget_iss_rates'
ORDER BY ordinal_position;

-- 3. Contar registros existentes
SELECT 
  COUNT(*) as total_cidades,
  COUNT(*) FILTER (WHERE is_active = true) as cidades_ativas,
  COUNT(*) FILTER (WHERE is_active = false) as cidades_inativas
FROM public.budget_iss_rates;

-- 4. Listar todas as cidades na tabela
SELECT 
  id,
  city_name,
  iss_rate,
  is_active,
  created_at
FROM public.budget_iss_rates 
ORDER BY city_name;

-- 5. Verificar políticas RLS
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'budget_iss_rates';

-- 6. Se a tabela estiver vazia ou sem cidades ativas, inserir dados
INSERT INTO public.budget_iss_rates (city_name, iss_rate, is_active) 
VALUES
  ('São Paulo', 2.0, true),
  ('Campinas', 5.0, true),
  ('Ribeirão Preto', 2.0, true),
  ('Sorocaba', 5.0, true),
  ('Piracicaba', 5.0, true),
  ('Barueri', 5.0, true),
  ('Guarulhos', 3.0, true),
  ('Osasco', 5.0, true),
  ('São José dos Campos', 3.0, true),
  ('Taubaté', 5.0, true)
ON CONFLICT (city_name) 
DO UPDATE SET 
  iss_rate = EXCLUDED.iss_rate,
  is_active = true;

-- 7. Confirmar inserção
SELECT 
  'Após inserção' as status,
  COUNT(*) as total_cidades,
  COUNT(*) FILTER (WHERE is_active = true) as cidades_ativas
FROM public.budget_iss_rates;

-- 8. Testar query que o componente React faz
SELECT 
  id, 
  city_name, 
  iss_rate, 
  is_active 
FROM public.budget_iss_rates 
WHERE is_active = true 
ORDER BY city_name ASC;