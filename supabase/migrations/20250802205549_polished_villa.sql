/*
  # Sistema Completo de Orçamentos

  1. New Tables
    - `budgets`
      - `id` (uuid, primary key)
      - `nome` (text, nome do orçamento)
      - `status` (text, pendente/aprovado/reprovado)
      - `criado_por` (uuid, referência para usuários)
      - `criado_em` (timestamp)
      - `aprovado_por` (uuid, referência para usuários)
      - `aprovado_em` (timestamp)
    
    - `budget_posts`
      - `id` (uuid, primary key)
      - `budget_id` (uuid, referência para budgets)
      - `nome_posto` (text, nome do posto)
      - `cargo` (text, cargo selecionado)
      - `escala` (text, escala de trabalho)
      - `turno` (text, diurno/noturno)
      - `bloco_1` a `bloco_8` (json, dados dos 8 blocos)
    
    - `budget_job_roles` 
      - Tabela de cargos configuráveis
    
    - `budget_work_scales`
      - Tabela de escalas configuráveis

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    
  3. Initial Data
    - Popular cargos com salários base
    - Popular escalas de trabalho padrão
*/

-- Criar tabela de orçamentos
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'reprovado')),
  criado_por uuid,
  criado_em timestamptz DEFAULT now(),
  aprovado_por uuid,
  aprovado_em timestamptz
);

-- Criar tabela de postos do orçamento
CREATE TABLE IF NOT EXISTS budget_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  nome_posto text NOT NULL,
  cargo text NOT NULL,
  escala text NOT NULL,
  turno text NOT NULL CHECK (turno IN ('Diurno', 'Noturno')),
  bloco_1 jsonb DEFAULT '{}',
  bloco_2 jsonb DEFAULT '{}',
  bloco_3 jsonb DEFAULT '{}',
  bloco_4 jsonb DEFAULT '{}',
  bloco_5 jsonb DEFAULT '{}',
  bloco_6 jsonb DEFAULT '{}',
  bloco_7 jsonb DEFAULT '{}',
  bloco_8 jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de cargos configuráveis
CREATE TABLE IF NOT EXISTS budget_job_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name text UNIQUE NOT NULL,
  base_salary decimal(10,2) NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de escalas de trabalho
CREATE TABLE IF NOT EXISTS budget_work_scales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scale_name text UNIQUE NOT NULL,
  people_quantity decimal(4,2) NOT NULL,
  working_days decimal(4,2) NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_work_scales ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para budgets
CREATE POLICY "Users can view budgets" ON budgets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert budgets" ON budgets FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update budgets" ON budgets FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete budgets" ON budgets FOR DELETE TO authenticated USING (true);

-- Políticas de acesso para budget_posts
CREATE POLICY "Users can view budget posts" ON budget_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert budget posts" ON budget_posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update budget posts" ON budget_posts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete budget posts" ON budget_posts FOR DELETE TO authenticated USING (true);

-- Políticas de acesso para budget_job_roles
CREATE POLICY "Users can view job roles" ON budget_job_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert job roles" ON budget_job_roles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update job roles" ON budget_job_roles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete job roles" ON budget_job_roles FOR DELETE TO authenticated USING (true);

-- Políticas de acesso para budget_work_scales
CREATE POLICY "Users can view work scales" ON budget_work_scales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert work scales" ON budget_work_scales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update work scales" ON budget_work_scales FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete work scales" ON budget_work_scales FOR DELETE TO authenticated USING (true);

-- Inserir cargos padrão com salários base
INSERT INTO budget_job_roles (role_name, base_salary) VALUES
('Porteiro', 1412.00),
('Vigilante', 1412.00),
('Supervisor de Portaria', 1800.00),
('Encarregado de Portaria', 2200.00),
('Técnico de Segurança', 1600.00),
('Operador de CFTV', 1500.00),
('Coordenador de Segurança', 2500.00),
('Auxiliar de Limpeza', 1412.00),
('Faxineiro', 1412.00),
('Auxiliar de Serviços Gerais', 1412.00)
ON CONFLICT (role_name) DO NOTHING;

-- Inserir escalas de trabalho padrão
INSERT INTO budget_work_scales (scale_name, people_quantity, working_days) VALUES
('12h segunda a sexta', 1.37, 21.00),
('12x36 segunda a domingo', 2.00, 30.44),
('44hs segunda a sexta', 1.00, 22.00),
('44hs segunda a sábado', 1.00, 25.00),
('44hs segunda a domingo', 1.30, 30.44)
ON CONFLICT (scale_name) DO NOTHING;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_budget_posts_budget_id ON budget_posts(budget_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_budgets_created_at ON budgets(criado_em DESC);