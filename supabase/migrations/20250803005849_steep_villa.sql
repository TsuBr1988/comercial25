/*
  # Estrutura completa para cálculo de orçamentos

  1. New Tables
    - `budget_iss_rates` - Alíquotas de ISS por cidade
    - `budget_materials` - Materiais base para orçamentos
    - `budget_uniforms` - Uniformes base com vida útil
    - `budget_position_blocks` - Blocos de cálculo por posto
    - `budget_position_items` - Itens específicos de cada bloco
  
  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
  
  3. Sample Data
    - ISS rates for major cities
    - Base materials and uniforms
    - Default calculation parameters
*/

-- Tabela de alíquotas de ISS por cidade
CREATE TABLE IF NOT EXISTS budget_iss_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name text NOT NULL,
  iss_rate numeric(5,4) NOT NULL, -- Ex: 0.0200 para 2%
  state text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tabela de materiais base
CREATE TABLE IF NOT EXISTS budget_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  unit_value numeric(10,2) DEFAULT 0,
  unit text DEFAULT 'unidade', -- unidade, kg, litros, etc
  category text DEFAULT 'material',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tabela de uniformes base
CREATE TABLE IF NOT EXISTS budget_uniforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  unit_value numeric(10,2) DEFAULT 0,
  quantity_per_employee integer DEFAULT 1, -- Quantos por funcionário
  useful_life_months integer DEFAULT 12, -- Vida útil em meses
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tabela para armazenar os blocos de cálculo de cada posto
CREATE TABLE IF NOT EXISTS budget_position_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id uuid NOT NULL, -- Referência ao posto em budget_posts
  block_type text NOT NULL, -- 'salary', 'social_charges', 'benefits', etc
  block_order integer NOT NULL,
  total_value numeric(12,2) DEFAULT 0,
  is_calculated boolean DEFAULT true, -- Se o valor é calculado ou manual
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela para itens específicos de cada bloco
CREATE TABLE IF NOT EXISTS budget_position_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid REFERENCES budget_position_blocks(id) ON DELETE CASCADE,
  item_type text NOT NULL, -- 'addition', 'material', 'uniform', 'benefit'
  item_name text NOT NULL,
  base_value numeric(12,2) DEFAULT 0,
  percentage numeric(5,2) DEFAULT 0, -- Para adicionais em %
  quantity numeric(10,3) DEFAULT 1,
  calculated_value numeric(12,2) DEFAULT 0,
  formula_notes text, -- Para documentar a fórmula usada
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela para configurações de encargos sociais fixos
CREATE TABLE IF NOT EXISTS budget_social_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  charge_name text NOT NULL,
  percentage numeric(5,4) NOT NULL, -- Ex: 0.0800 para 8%
  base_calculation text DEFAULT 'salary_total', -- 'salary_total', 'minimum_wage', etc
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE budget_iss_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_uniforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_position_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_position_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_social_charges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view ISS rates" ON budget_iss_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert ISS rates" ON budget_iss_rates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update ISS rates" ON budget_iss_rates FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete ISS rates" ON budget_iss_rates FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view materials" ON budget_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert materials" ON budget_materials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update materials" ON budget_materials FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete materials" ON budget_materials FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view uniforms" ON budget_uniforms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert uniforms" ON budget_uniforms FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update uniforms" ON budget_uniforms FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete uniforms" ON budget_uniforms FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view position blocks" ON budget_position_blocks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert position blocks" ON budget_position_blocks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update position blocks" ON budget_position_blocks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete position blocks" ON budget_position_blocks FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view position items" ON budget_position_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert position items" ON budget_position_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update position items" ON budget_position_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete position items" ON budget_position_items FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can view social charges" ON budget_social_charges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert social charges" ON budget_social_charges FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update social charges" ON budget_social_charges FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete social charges" ON budget_social_charges FOR DELETE TO authenticated USING (true);

-- Inserir dados iniciais para ISS (principais cidades)
INSERT INTO budget_iss_rates (city_name, iss_rate, state) VALUES
('São Paulo', 0.0200, 'SP'),
('Rio de Janeiro', 0.0500, 'RJ'),
('Belo Horizonte', 0.0300, 'MG'),
('Brasília', 0.0200, 'DF'),
('Salvador', 0.0300, 'BA'),
('Fortaleza', 0.0250, 'CE'),
('Recife', 0.0300, 'PE'),
('Porto Alegre', 0.0300, 'RS'),
('Curitiba', 0.0300, 'PR'),
('Goiânia', 0.0300, 'GO'),
('Belém', 0.0300, 'PA'),
('Manaus', 0.0300, 'AM');

-- Inserir materiais base
INSERT INTO budget_materials (name, description, unit_value, unit, category) VALUES
('Papel higiênico', 'Rolo duplo', 3.50, 'rolo', 'higiene'),
('Sabonete líquido', 'Refil 800ml', 12.90, 'refil', 'higiene'),
('Detergente neutro', 'Frasco 500ml', 4.20, 'frasco', 'limpeza'),
('Álcool gel', 'Frasco 500ml', 8.50, 'frasco', 'higiene'),
('Papel toalha', 'Rolo duplo', 6.80, 'rolo', 'higiene'),
('Lustra móveis', 'Spray 500ml', 15.30, 'frasco', 'limpeza'),
('Desinfetante', 'Frasco 1L', 7.90, 'frasco', 'limpeza'),
('Saco de lixo 60L', 'Pacote com 100 unidades', 28.40, 'pacote', 'limpeza');

-- Inserir uniformes base
INSERT INTO budget_uniforms (name, unit_value, quantity_per_employee, useful_life_months) VALUES
('Camisa social manga longa', 45.90, 3, 12),
('Calça social', 55.80, 2, 18),
('Sapato social', 89.90, 1, 24),
('Cinto de couro', 35.50, 1, 36),
('Meia social', 12.90, 6, 6),
('Jaqueta/Blazer', 120.00, 1, 24),
('Gravata', 25.50, 2, 24);

-- Inserir encargos sociais padrão
INSERT INTO budget_social_charges (charge_name, percentage, base_calculation) VALUES
('INSS Empresa', 0.2000, 'salary_total'), -- 20%
('FGTS', 0.0800, 'salary_total'), -- 8%
('Terceiros (SESI/SENAI/INCRA)', 0.0580, 'salary_total'), -- 5.8%
('Férias', 0.1111, 'salary_total'), -- 11.11%
('13º Salário', 0.0833, 'salary_total'), -- 8.33%
('1/3 de Férias', 0.0370, 'salary_total'), -- 3.7%
('Aviso Prévio', 0.0417, 'salary_total'); -- 4.17%

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_budget_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_budget_position_blocks_updated_at
  BEFORE UPDATE ON budget_position_blocks
  FOR EACH ROW EXECUTE FUNCTION update_budget_blocks_updated_at();

CREATE TRIGGER update_budget_position_items_updated_at
  BEFORE UPDATE ON budget_position_items
  FOR EACH ROW EXECUTE FUNCTION update_budget_blocks_updated_at();