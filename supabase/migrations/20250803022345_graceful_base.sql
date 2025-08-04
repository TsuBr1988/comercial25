/*
  # Criar tabela budget_posts e trigger para recálculo automático do orçamento

  1. Nova Tabela
    - `budget_posts` - Armazena postos de cada orçamento
      - `id` (uuid, primary key)
      - `budget_id` (uuid, foreign key para budgets)
      - `post_name` (text, nome do posto)
      - `role_id` (uuid, foreign key para budget_job_roles)
      - `scale_id` (uuid, foreign key para budget_work_scales)
      - `turn` (text, 'Diurno' ou 'Noturno')
      - `city_id` (uuid, foreign key para budget_cities)
      - `salary_additions` (jsonb, adicionais salariais)
      - `total_cost` (numeric, custo total calculado)
      - `created_at` e `updated_at` (timestamp)

  2. Função e Trigger
    - Função `calculate_budget_total_value()` para recalcular total
    - Trigger automático após INSERT/UPDATE/DELETE em budget_posts
    - Atualiza automaticamente o campo `total_value` na tabela budgets

  3. Segurança
    - RLS habilitado
    - Policies para authenticated users
*/

-- Criar tabela budget_posts
CREATE TABLE IF NOT EXISTS public.budget_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  post_name text NOT NULL,
  role_id uuid REFERENCES public.budget_job_roles(id),
  scale_id uuid REFERENCES public.budget_work_scales(id),
  turn text NOT NULL CHECK (turn IN ('Diurno', 'Noturno')),
  city_id uuid REFERENCES public.budget_cities(id),
  salary_additions jsonb DEFAULT '[]'::jsonb,
  total_cost numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_budget_posts_budget_id ON public.budget_posts(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_posts_created_at ON public.budget_posts(created_at DESC);

-- Função para recalcular total_value do orçamento
CREATE OR REPLACE FUNCTION public.calculate_budget_total_value()
RETURNS trigger AS $$
BEGIN
  -- Atualizar o total_value do orçamento somando todos os postos
  UPDATE public.budgets
  SET 
    total_value = (
      SELECT COALESCE(SUM(bp.total_cost), 0)
      FROM public.budget_posts bp
      WHERE bp.budget_id = COALESCE(NEW.budget_id, OLD.budget_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.budget_id, OLD.budget_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger que executa após operações em budget_posts
DROP TRIGGER IF EXISTS update_budget_total_value_trigger ON public.budget_posts;
CREATE TRIGGER update_budget_total_value_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.budget_posts
  FOR EACH ROW EXECUTE FUNCTION public.calculate_budget_total_value();

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_budget_posts_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_budget_posts_updated_at_trigger ON public.budget_posts;
CREATE TRIGGER update_budget_posts_updated_at_trigger
  BEFORE UPDATE ON public.budget_posts
  FOR EACH ROW EXECUTE FUNCTION update_budget_posts_updated_at();

-- Habilitar RLS
ALTER TABLE public.budget_posts ENABLE ROW LEVEL SECURITY;

-- Policies para RLS
CREATE POLICY "Users can view budget posts"
  ON public.budget_posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert budget posts"
  ON public.budget_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update budget posts"
  ON public.budget_posts
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete budget posts"
  ON public.budget_posts
  FOR DELETE
  TO authenticated
  USING (true);