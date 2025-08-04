/*
  # Sistema de Orçamentos - Estrutura Completa

  1. Novas Tabelas
    - `budgets` - Orçamentos principais
    - `budget_positions` - Postos dentro dos orçamentos
    - `budget_position_blocks` - 8 blocos fixos de cada posto
    - `budget_job_roles` - Cargos e salários base
    - `budget_work_scales` - Escalas de trabalho

  2. Segurança
    - Enable RLS em todas as tabelas
    - Políticas para usuários autenticados

  3. Configurações
    - Dados iniciais para cargos e escalas
*/

-- Tabela principal de orçamentos
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_number integer UNIQUE NOT NULL,
  client text NOT NULL,
  project_name text NOT NULL,
  total_value numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Rascunho' CHECK (status IN ('Rascunho', 'Pendente', 'Aprovado', 'Rejeitado')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de postos do orçamento
CREATE TABLE IF NOT EXISTS budget_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE,
  position_name text NOT NULL,
  job_role text NOT NULL,
  work_scale text NOT NULL,
  shift_type text NOT NULL CHECK (shift_type IN ('Diurno', 'Noturno')),
  position_order integer DEFAULT 1,
  total_cost numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela dos 8 blocos fixos de cada posto
CREATE TABLE IF NOT EXISTS budget_position_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid REFERENCES budget_positions(id) ON DELETE CASCADE,
  block_type text NOT NULL CHECK (block_type IN (
    'salary_composition',
    'social_charges', 
    'benefits',
    'materials',
    'uniforms',
    'intrajornada_costs',
    'indirect_expenses',
    'position_total'
  )),
  block_data jsonb NOT NULL DEFAULT '{}',
  block_value numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de cargos e salários base (configurável)
CREATE TABLE IF NOT EXISTS budget_job_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text UNIQUE NOT NULL,
  base_salary numeric(8,2) NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de escalas de trabalho (configurável)
CREATE TABLE IF NOT EXISTS budget_work_scales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scale_name text UNIQUE NOT NULL,
  people_quantity numeric(3,2) NOT NULL,
  working_days numeric(4,2) NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inserir dados iniciais para cargos
INSERT INTO budget_job_roles (role_name, base_salary) VALUES
('Porteiro', 1412.00),
('Controlador de Acesso', 1412.00),
('Vigilante', 1412.00),
('Supervisor de Segurança', 2000.00),
('Recepcionista', 1412.00),
('Auxiliar de Limpeza', 1412.00),
('Encarregado de Limpeza', 1600.00),
('Jardineiro', 1412.00),
('Zelador', 1500.00),
('Manobrista', 1412.00)
ON CONFLICT (role_name) DO NOTHING;

-- Inserir dados iniciais para escalas
INSERT INTO budget_work_scales (scale_name, people_quantity, working_days) VALUES
('12h segunda a sexta', 1.37, 21.00),
('12x36 segunda a domingo', 2.00, 30.44),
('44hs segunda a sexta', 1.00, 22.00),
('44hs segunda a sábado', 1.00, 25.00),
('44hs segunda a domingo', 1.30, 30.44)
ON CONFLICT (scale_name) DO NOTHING;

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_budgets_client ON budgets(client);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_budgets_created_at ON budgets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budget_positions_budget_id ON budget_positions(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_position_blocks_position_id ON budget_position_blocks(position_id);

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_position_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_work_scales ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view budgets" ON budgets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert budgets" ON budgets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update budgets" ON budgets FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete budgets" ON budgets FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view budget positions" ON budget_positions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert budget positions" ON budget_positions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update budget positions" ON budget_positions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete budget positions" ON budget_positions FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view position blocks" ON budget_position_blocks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert position blocks" ON budget_position_blocks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update position blocks" ON budget_position_blocks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete position blocks" ON budget_position_blocks FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view job roles" ON budget_job_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert job roles" ON budget_job_roles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update job roles" ON budget_job_roles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete job roles" ON budget_job_roles FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view work scales" ON budget_work_scales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert work scales" ON budget_work_scales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update work scales" ON budget_work_scales FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete work scales" ON budget_work_scales FOR DELETE TO authenticated USING (true);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_budgets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_budgets_updated_at();