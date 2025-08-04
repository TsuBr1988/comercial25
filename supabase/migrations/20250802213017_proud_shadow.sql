/*
  # Criar tabela budget_posts

  1. Nova Tabela
    - `budget_posts`
      - `id` (uuid, primary key)
      - `budget_id` (uuid, foreign key para budgets)
      - `nome_posto` (text)
      - `cargo` (text)
      - `escala` (text)
      - `turno` (text)
      - `total_cost` (numeric, para valor calculado)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Enable RLS na tabela budget_posts
    - Add políticas para authenticated users
*/

-- Criar tabela budget_posts
CREATE TABLE IF NOT EXISTS public.budget_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES public.budgets(id) ON DELETE CASCADE,
  nome_posto text NOT NULL,
  cargo text NOT NULL,
  escala text NOT NULL,
  turno text NOT NULL DEFAULT 'Diurno',
  total_cost numeric(12,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.budget_posts ENABLE ROW LEVEL SECURITY;

-- Políticas para authenticated users
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

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_budget_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_budget_posts_updated_at
  BEFORE UPDATE ON public.budget_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_posts_updated_at();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_budget_posts_budget_id ON public.budget_posts(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_posts_active ON public.budget_posts(is_active) WHERE is_active = true;