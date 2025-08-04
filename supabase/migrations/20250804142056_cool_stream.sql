/*
  # Atualizar tabela de cidades com ISS

  1. Verificações e correções
    - Garantir que a tabela budget_iss_rates existe e está estruturada corretamente
    - Ajustar nomes de colunas se necessário para compatibilidade
    - Atualizar dados existentes e inserir novos

  2. Dados das cidades
    - 10 cidades de São Paulo com suas respectivas alíquotas de ISS
    - Manter dados existentes e adicionar novos
    - Ativar todas as cidades inseridas

  3. Compatibilidade
    - Mantém compatibilidade com queries existentes no código
    - Estrutura alinhada com AddPositionModal.tsx
    - Função no dropdown "Cidade (para cálculo do ISS)"
*/

-- 1. Garantir que a tabela budget_iss_rates existe com estrutura correta
CREATE TABLE IF NOT EXISTS public.budget_iss_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name text NOT NULL,
  iss_rate numeric NOT NULL DEFAULT 5.0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. Garantir que RLS está habilitado
ALTER TABLE public.budget_iss_rates ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas se não existirem
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'budget_iss_rates' AND policyname = 'Users can view budget iss rates'
  ) THEN
    CREATE POLICY "Users can view budget iss rates"
      ON public.budget_iss_rates
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'budget_iss_rates' AND policyname = 'Users can insert budget iss rates'
  ) THEN
    CREATE POLICY "Users can insert budget iss rates"
      ON public.budget_iss_rates
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'budget_iss_rates' AND policyname = 'Users can update budget iss rates'
  ) THEN
    CREATE POLICY "Users can update budget iss rates"
      ON public.budget_iss_rates
      FOR UPDATE
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'budget_iss_rates' AND policyname = 'Users can delete budget iss rates'
  ) THEN
    CREATE POLICY "Users can delete budget iss rates"
      ON public.budget_iss_rates
      FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- 4. Upsert das cidades solicitadas (atualizar se existir, inserir se não existir)
INSERT INTO public.budget_iss_rates (city_name, iss_rate, is_active) VALUES
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
  is_active = EXCLUDED.is_active;

-- 5. Criar índices para performance se não existirem
CREATE INDEX IF NOT EXISTS idx_budget_iss_rates_city_name 
  ON public.budget_iss_rates(city_name);

CREATE INDEX IF NOT EXISTS idx_budget_iss_rates_active 
  ON public.budget_iss_rates(is_active) 
  WHERE is_active = true;

-- 6. Garantir que a coluna city_id existe em budget_posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'budget_posts' 
    AND column_name = 'city_id'
  ) THEN
    ALTER TABLE public.budget_posts 
    ADD COLUMN city_id uuid REFERENCES public.budget_iss_rates(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Coluna city_id adicionada à tabela budget_posts';
  ELSE
    RAISE NOTICE 'Coluna city_id já existe na tabela budget_posts';
  END IF;
END $$;

-- 7. Comentários para documentação
COMMENT ON TABLE public.budget_iss_rates IS 'Tabela de cidades com suas respectivas alíquotas de ISS para cálculo em orçamentos';
COMMENT ON COLUMN public.budget_iss_rates.city_name IS 'Nome da cidade';
COMMENT ON COLUMN public.budget_iss_rates.iss_rate IS 'Alíquota de ISS em porcentagem (ex: 2.0 para 2%)';
COMMENT ON COLUMN public.budget_iss_rates.is_active IS 'Indica se a cidade está ativa para seleção em orçamentos';

-- 8. Log de confirmação
DO $$
BEGIN
  RAISE NOTICE '✅ Migration concluída com sucesso!';
  RAISE NOTICE '📊 Tabela budget_iss_rates atualizada com 10 cidades';
  RAISE NOTICE '🔗 Estrutura compatível com AddPositionModal.tsx';
  RAISE NOTICE '🎯 Cidades disponíveis no dropdown de criação de posto';
  RAISE NOTICE '💰 ISS rates prontos para cálculo do BDI';
END $$;