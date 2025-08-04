/*
  # Create Budget System Tables

  1. New Tables
    - `budgets` - Main budget records
    - `budget_posts` - Positions within budgets  
    - `budget_job_roles` - Job roles with base salaries
    - `budget_work_scales` - Work scales with people and days
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    
  3. Initial Data
    - Populate job roles with base salaries
    - Populate work scales with standard configurations
*/

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_number integer UNIQUE NOT NULL,
  client text NOT NULL,
  project_name text NOT NULL,
  total_value numeric(12,2) DEFAULT 0,
  status text DEFAULT 'Rascunho' CHECK (status IN ('Rascunho', 'Pendente', 'Aprovado', 'Rejeitado')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create budget_posts table  
CREATE TABLE IF NOT EXISTS budget_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE,
  nome_posto text NOT NULL,
  cargo text NOT NULL,
  escala text NOT NULL,
  turno text NOT NULL CHECK (turno IN ('Diurno', 'Noturno')),
  total_cost numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create budget_job_roles table
CREATE TABLE IF NOT EXISTS budget_job_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text UNIQUE NOT NULL,
  base_salary numeric(10,2) NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create budget_work_scales table
CREATE TABLE IF NOT EXISTS budget_work_scales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scale_name text UNIQUE NOT NULL,
  people_quantity numeric(4,2) NOT NULL,
  working_days numeric(5,2) NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_work_scales ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert budgets"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update budgets"
  ON budgets FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete budgets"
  ON budgets FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Users can view budget posts"
  ON budget_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert budget posts"
  ON budget_posts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update budget posts"
  ON budget_posts FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete budget posts"
  ON budget_posts FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Users can view job roles"
  ON budget_job_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert job roles"
  ON budget_job_roles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update job roles"
  ON budget_job_roles FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete job roles"
  ON budget_job_roles FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Users can view work scales"
  ON budget_work_scales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert work scales"
  ON budget_work_scales FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update work scales"
  ON budget_work_scales FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete work scales"
  ON budget_work_scales FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_budgets_created_at ON budgets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budget_posts_budget_id ON budget_posts(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_job_roles_active ON budget_job_roles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_budget_work_scales_active ON budget_work_scales(is_active) WHERE is_active = true;

-- Create function for updating updated_at
CREATE OR REPLACE FUNCTION update_budgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_budgets_updated_at'
  ) THEN
    CREATE TRIGGER update_budgets_updated_at
      BEFORE UPDATE ON budgets
      FOR EACH ROW
      EXECUTE FUNCTION update_budgets_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_budget_posts_updated_at'
  ) THEN
    CREATE TRIGGER update_budget_posts_updated_at
      BEFORE UPDATE ON budget_posts
      FOR EACH ROW
      EXECUTE FUNCTION update_budgets_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_budget_job_roles_updated_at'
  ) THEN
    CREATE TRIGGER update_budget_job_roles_updated_at
      BEFORE UPDATE ON budget_job_roles
      FOR EACH ROW
      EXECUTE FUNCTION update_budgets_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_budget_work_scales_updated_at'
  ) THEN
    CREATE TRIGGER update_budget_work_scales_updated_at
      BEFORE UPDATE ON budget_work_scales
      FOR EACH ROW
      EXECUTE FUNCTION update_budgets_updated_at();
  END IF;
END $$;

-- Insert initial job roles data
INSERT INTO budget_job_roles (role_name, base_salary) VALUES
  ('Porteiro', 1412.00),
  ('Vigilante', 1412.00),
  ('Supervisor de Segurança', 1800.00),
  ('Técnico de Segurança', 3000.00),
  ('Coordenador de Segurança', 4000.00),
  ('Operador de CFTV', 1500.00),
  ('Controlador de Acesso', 1412.00),
  ('Recepcionista', 1412.00),
  ('Auxiliar de Limpeza', 1412.00),
  ('Encarregado de Limpeza', 1600.00)
ON CONFLICT (role_name) DO NOTHING;

-- Insert initial work scales data
INSERT INTO budget_work_scales (scale_name, people_quantity, working_days) VALUES
  ('12h segunda a sexta', 1.37, 21.00),
  ('12x36 segunda a domingo', 2.00, 30.44),
  ('44hs segunda a sexta', 1.00, 22.00),
  ('44hs segunda a sábado', 1.00, 25.00),
  ('44hs segunda a domingo', 1.30, 30.44)
ON CONFLICT (scale_name) DO NOTHING;