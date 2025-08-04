/*
  # Popular dados base para sistema de orçamentos

  1. Tabelas Criadas
    - `budget_job_roles` - Cargos e salários base
    - `budget_work_scales` - Escalas de trabalho com pessoas e dias

  2. Dados Iniciais
    - 10 cargos padrão com salários base
    - 5 escalas de trabalho com configurações

  3. Configuração
    - RLS habilitado com políticas para authenticated users
    - Dados baseados na imagem fornecida pelo usuário
*/

-- Criar tabela de cargos se não existir
CREATE TABLE IF NOT EXISTS budget_job_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text NOT NULL UNIQUE,
  base_salary numeric(12,2) NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de escalas se não existir  
CREATE TABLE IF NOT EXISTS budget_work_scales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scale_name text NOT NULL UNIQUE,
  people_quantity numeric(5,2) NOT NULL,
  working_days numeric(5,2) NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE budget_job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_work_scales ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
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

-- Popular dados iniciais de cargos (baseado na imagem)
INSERT INTO budget_job_roles (role_name, base_salary) VALUES
  ('Porteiro', 1412.00),
  ('Vigilante', 1412.00),
  ('Supervisor de Portaria', 1800.00),
  ('Encarregado', 2500.00),
  ('Técnico de Segurança', 3000.00),
  ('Analista de Segurança', 3500.00),
  ('Coordenador', 4000.00),
  ('Gerente de Operações', 5500.00),
  ('Assistente Administrativo', 1600.00),
  ('Auxiliar de Limpeza', 1412.00)
ON CONFLICT (role_name) DO NOTHING;

-- Popular dados iniciais de escalas (baseado na lista fornecida)
INSERT INTO budget_work_scales (scale_name, people_quantity, working_days) VALUES
  ('12h segunda a sexta', 1.37, 21.00),
  ('12x36 segunda a domingo', 2.00, 30.44),
  ('44hs segunda a sexta', 1.00, 22.00),
  ('44hs segunda a sábado', 1.00, 25.00),
  ('44hs segunda a domingo', 1.30, 30.44)
ON CONFLICT (scale_name) DO NOTHING;

-- Criar triggers para updated_at
CREATE OR REPLACE FUNCTION update_budget_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_budget_job_roles_updated_at
  BEFORE UPDATE ON budget_job_roles
  FOR EACH ROW EXECUTE FUNCTION update_budget_tables_updated_at();

CREATE TRIGGER update_budget_work_scales_updated_at
  BEFORE UPDATE ON budget_work_scales
  FOR EACH ROW EXECUTE FUNCTION update_budget_tables_updated_at();