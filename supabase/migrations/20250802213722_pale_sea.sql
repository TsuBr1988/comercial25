/*
  # Criar tabelas auxiliares para sistema de orçamentos

  1. Tabelas criadas
    - `budget_work_scales` - Escalas de trabalho com pessoas e dias
    - `budget_turns` - Turnos de trabalho (Diurno/Noturno)
    - `budget_salary_additions` - Adicionais salariais configuráveis

  2. Dados iniciais
    - 5 escalas padrão com pessoas e dias trabalhados
    - 2 turnos básicos
    - 2 adicionais salariais exemplo

  3. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas para usuários autenticados
    - Triggers para updated_at
*/

-- Criar tabela de escalas de trabalho
CREATE TABLE IF NOT EXISTS public.budget_work_scales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scale_name text NOT NULL,
  people_quantity numeric NOT NULL,
  working_days numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de turnos
CREATE TABLE IF NOT EXISTS public.budget_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de adicionais salariais
CREATE TABLE IF NOT EXISTS public.budget_salary_additions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  base_reference text NOT NULL, -- "salario_base" | "salario_minimo" | "valor_fixo"
  is_required boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.budget_work_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_salary_additions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para budget_work_scales
CREATE POLICY "Users can read budget work scales"
  ON public.budget_work_scales
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert budget work scales"
  ON public.budget_work_scales
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update budget work scales"
  ON public.budget_work_scales
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete budget work scales"
  ON public.budget_work_scales
  FOR DELETE
  TO authenticated
  USING (true);

-- Políticas RLS para budget_turns
CREATE POLICY "Users can read budget turns"
  ON public.budget_turns
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert budget turns"
  ON public.budget_turns
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update budget turns"
  ON public.budget_turns
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete budget turns"
  ON public.budget_turns
  FOR DELETE
  TO authenticated
  USING (true);

-- Políticas RLS para budget_salary_additions
CREATE POLICY "Users can read budget salary additions"
  ON public.budget_salary_additions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert budget salary additions"
  ON public.budget_salary_additions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update budget salary additions"
  ON public.budget_salary_additions
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete budget salary additions"
  ON public.budget_salary_additions
  FOR DELETE
  TO authenticated
  USING (true);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_budget_work_scales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_budget_turns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_budget_salary_additions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_budget_work_scales_updated_at
  BEFORE UPDATE ON public.budget_work_scales
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_work_scales_updated_at();

CREATE TRIGGER update_budget_turns_updated_at
  BEFORE UPDATE ON public.budget_turns
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_turns_updated_at();

CREATE TRIGGER update_budget_salary_additions_updated_at
  BEFORE UPDATE ON public.budget_salary_additions
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_salary_additions_updated_at();

-- Popular dados iniciais para escalas de trabalho
INSERT INTO public.budget_work_scales (scale_name, people_quantity, working_days) VALUES
  ('12h segunda a sexta', 1.37, 21),
  ('12x36 segunda a domingo', 2, 30.44),
  ('44hs segunda a sexta', 1, 22),
  ('44hs segunda a sábado', 1, 25),
  ('44hs segunda a domingo', 1.3, 30.44);

-- Popular dados iniciais para turnos
INSERT INTO public.budget_turns (name) VALUES
  ('Diurno'),
  ('Noturno');

-- Popular dados iniciais para adicionais salariais
INSERT INTO public.budget_salary_additions (name, base_reference, is_required) VALUES
  ('Insalubridade', 'salario_minimo', false),
  ('Adicional de Função', 'salario_base', false),
  ('Adicional Noturno', 'salario_base', false),
  ('Adicional de Risco', 'salario_minimo', false);