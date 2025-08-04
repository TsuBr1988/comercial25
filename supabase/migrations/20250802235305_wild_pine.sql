/*
  # Create budget job roles and posts tables

  1. New Tables
    - `budget_job_roles`
      - `id` (uuid, primary key)
      - `role_name` (text, not null)
      - `base_salary` (numeric, not null)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz, default now())
    - `budget_posts`
      - `id` (uuid, primary key)
      - `budget_id` (uuid, references budgets)
      - `nome_posto` (text, not null)
      - `cargo` (text, not null)
      - `escala` (text, not null)
      - `turno` (text, not null)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage data

  3. Initial Data
    - Populate job roles with base salaries
*/

-- Create budget_job_roles table
CREATE TABLE IF NOT EXISTS budget_job_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text NOT NULL,
  base_salary numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create budget_posts table
CREATE TABLE IF NOT EXISTS budget_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL,
  nome_posto text NOT NULL,
  cargo text NOT NULL,
  escala text NOT NULL,
  turno text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE budget_job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for budget_job_roles
CREATE POLICY "Users can view job roles"
  ON budget_job_roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert job roles"
  ON budget_job_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update job roles"
  ON budget_job_roles
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete job roles"
  ON budget_job_roles
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for budget_posts
CREATE POLICY "Users can view budget posts"
  ON budget_posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert budget posts"
  ON budget_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update budget posts"
  ON budget_posts
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete budget posts"
  ON budget_posts
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert initial job roles data
INSERT INTO budget_job_roles (role_name, base_salary) VALUES
  ('Porteiro/Controlador de Acesso', 2021.12),
  ('Zelador', 2197.31),
  ('Auxiliar de Manutenção', 1766.58),
  ('Agente de Higienização', 1717.20),
  ('Vigilante', 1412.00),
  ('Supervisor de Segurança', 1800.00),
  ('Técnico de Segurança', 3000.00),
  ('Coordenador', 4000.00),
  ('Encarregado', 2500.00),
  ('Auxiliar Geral', 1412.00)
ON CONFLICT DO NOTHING;

-- Create budget_work_scales table if not exists
CREATE TABLE IF NOT EXISTS budget_work_scales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scale_name text NOT NULL,
  people_quantity numeric NOT NULL,
  working_days numeric NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for work scales
ALTER TABLE budget_work_scales ENABLE ROW LEVEL SECURITY;

-- Create policies for budget_work_scales
CREATE POLICY "Users can view work scales"
  ON budget_work_scales
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert work scales"
  ON budget_work_scales
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update work scales"
  ON budget_work_scales
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete work scales"
  ON budget_work_scales
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert initial work scales data
INSERT INTO budget_work_scales (scale_name, people_quantity, working_days) VALUES
  ('12h segunda a sexta', 1.37, 21),
  ('12x36 segunda a domingo', 2, 30.44),
  ('44hs segunda a sexta', 1, 22),
  ('44hs segunda a sábado', 1, 25),
  ('44hs segunda a domingo', 1.3, 30.44)
ON CONFLICT DO NOTHING;