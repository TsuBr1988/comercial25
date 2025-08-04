/*
  # Corrigir schema das tabelas de orçamento - Cidades ISS

  1. Renomeação de Tabelas
    - Renomear `budget_cities_iss` para `budget_iss_rates` 
    - Garantir consistência com o código da aplicação

  2. Correções de Schema
    - Adicionar coluna `iss_rate` se não existir
    - Adicionar coluna `city_id` em `budget_posts` 
    - Corrigir referências entre tabelas

  3. Dados
    - Preencher valores nulos de iss_rate com 3% default
    - Manter dados existentes intactos
*/

-- 1.1) Renomear tabela de cidades ISS para o nome esperado pela aplicação
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'budget_cities_iss'
  ) THEN
    -- Renomear a tabela
    ALTER TABLE public.budget_cities_iss RENAME TO budget_iss_rates;
    
    RAISE NOTICE 'Tabela budget_cities_iss renomeada para budget_iss_rates';
  ELSE
    RAISE NOTICE 'Tabela budget_cities_iss não existe - criando budget_iss_rates';
  END IF;
END $$;

-- 1.2) Criar tabela budget_iss_rates se não existir (fallback)
CREATE TABLE IF NOT EXISTS public.budget_iss_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name text NOT NULL,
  iss_rate numeric DEFAULT 3.0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 1.3) Garantir que a coluna iss_rate existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'budget_iss_rates' 
    AND column_name = 'iss_rate'
  ) THEN
    ALTER TABLE public.budget_iss_rates ADD COLUMN iss_rate numeric DEFAULT 3.0;
    RAISE NOTICE 'Coluna iss_rate adicionada à tabela budget_iss_rates';
  END IF;
END $$;

-- 1.4) Preencher valores nulos de iss_rate com 3% default
UPDATE public.budget_iss_rates
SET iss_rate = 3.0
WHERE iss_rate IS NULL;

-- 2.1) Adicionar coluna city_id em budget_posts se não existir
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
  END IF;
END $$;

-- 2.2) Garantir que a tabela budget_posts existe
CREATE TABLE IF NOT EXISTS public.budget_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  post_name text NOT NULL,
  role_id uuid REFERENCES public.budget_job_roles(id) ON DELETE SET NULL,
  scale_id uuid REFERENCES public.budget_work_scales(id) ON DELETE SET NULL,
  turn text DEFAULT 'Diurno',
  city_id uuid REFERENCES public.budget_iss_rates(id) ON DELETE SET NULL,
  salary_additions jsonb DEFAULT '[]'::jsonb,
  total_cost numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3) Habilitar RLS nas tabelas
ALTER TABLE public.budget_iss_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_posts ENABLE ROW LEVEL SECURITY;

-- 4) Criar políticas de RLS
CREATE POLICY IF NOT EXISTS "Users can view budget ISS rates"
  ON public.budget_iss_rates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert budget ISS rates"
  ON public.budget_iss_rates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Users can update budget ISS rates"
  ON public.budget_iss_rates
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can delete budget ISS rates"
  ON public.budget_iss_rates
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can view budget posts"
  ON public.budget_posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert budget posts"
  ON public.budget_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Users can update budget posts"
  ON public.budget_posts
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Users can delete budget posts"
  ON public.budget_posts
  FOR DELETE
  TO authenticated
  USING (true);

-- 5) Inserir dados de cidades brasileiras se a tabela estiver vazia
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.budget_iss_rates LIMIT 1) THEN
    INSERT INTO public.budget_iss_rates (city_name, iss_rate, is_active) VALUES
    ('São Paulo', 5.0, true),
    ('Rio de Janeiro', 5.0, true),
    ('Belo Horizonte', 5.0, true),
    ('Brasília', 5.0, true),
    ('Salvador', 5.0, true),
    ('Curitiba', 5.0, true),
    ('Porto Alegre', 2.5, true),
    ('Recife', 5.0, true),
    ('Fortaleza', 5.0, true),
    ('Goiânia', 5.0, true),
    ('Manaus', 5.0, true),
    ('Belém', 5.0, true),
    ('Guarulhos', 5.0, true),
    ('Campinas', 5.0, true),
    ('São Luís', 5.0, true),
    ('São Gonçalo', 5.0, true),
    ('Maceió', 5.0, true),
    ('Duque de Caxias', 5.0, true),
    ('Natal', 5.0, true),
    ('Teresina', 5.0, true),
    ('São Bernardo do Campo', 5.0, true),
    ('Nova Iguaçu', 5.0, true),
    ('João Pessoa', 5.0, true),
    ('Santo André', 5.0, true),
    ('São José dos Campos', 2.0, true),
    ('Jaboatão dos Guararapes', 5.0, true),
    ('Ribeirão Preto', 5.0, true),
    ('Uberlândia', 5.0, true),
    ('Contagem', 5.0, true),
    ('Sorocaba', 5.0, true);
    
    RAISE NOTICE 'Dados de cidades brasileiras inseridos com sucesso';
  ELSE
    RAISE NOTICE 'Tabela budget_iss_rates já possui dados - nenhuma inserção feita';
  END IF;
END $$;

-- 6) Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_budget_iss_rates_city_name 
  ON public.budget_iss_rates(city_name);

CREATE INDEX IF NOT EXISTS idx_budget_iss_rates_active 
  ON public.budget_iss_rates(is_active);

CREATE INDEX IF NOT EXISTS idx_budget_posts_city_id 
  ON public.budget_posts(city_id);