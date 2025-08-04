/*
  # Criar tabela budget_posts

  1. Nova Tabela
    - `budget_posts`
      - `id` (uuid, primary key)
      - `budget_id` (uuid, foreign key to budgets)
      - `nome_posto` (text, not null)
      - `cargo` (text)
      - `escala` (text)
      - `turno` (text)
      - `total_cost` (numeric, default 0)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Segurança
    - Habilitar RLS na tabela budget_posts
    - Adicionar políticas para usuários autenticados
    - Foreign key com cascade delete

  3. Índices
    - Índice para budget_id para otimizar consultas
    - Índice para is_active
*/

-- Criar tabela budget_posts
CREATE TABLE IF NOT EXISTS public.budget_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES public.budgets(id) ON DELETE CASCADE,
  nome_posto text NOT NULL,
  cargo text,
  escala text,
  turno text,
  total_cost numeric(12,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.budget_posts ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_budget_posts_budget_id 
  ON public.budget_posts(budget_id);

CREATE INDEX IF NOT EXISTS idx_budget_posts_active 
  ON public.budget_posts(is_active) 
  WHERE is_active = true;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_budget_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_budget_posts_updated_at
  BEFORE UPDATE ON public.budget_posts
  FOR EACH ROW EXECUTE FUNCTION update_budget_posts_updated_at();