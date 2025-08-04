/*
  # Criar tabelas budget_turns e budget_salary_additions

  1. Novas Tabelas
    - `budget_turns` - Turnos de trabalho (Diurno, Noturno)
    - `budget_salary_additions` - Adicionais salariais (Insalubridade, etc.)
  
  2. Dados Iniciais
    - 2 turnos padrão
    - 5 tipos de adicionais salariais comuns
  
  3. Segurança
    - RLS habilitado
    - Políticas para usuários autenticados
*/

-- Criar tabela de turnos
CREATE TABLE IF NOT EXISTS budget_turns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de adicionais salariais
CREATE TABLE IF NOT EXISTS budget_salary_additions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  default_percentage numeric(5,2) DEFAULT 0,
  calculation_base text DEFAULT 'salary_base',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE budget_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_salary_additions ENABLE ROW LEVEL SECURITY;

-- Políticas para turnos
CREATE POLICY "Users can view budget turns"
  ON budget_turns
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert budget turns"
  ON budget_turns
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update budget turns"
  ON budget_turns
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete budget turns"
  ON budget_turns
  FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para adicionais salariais
CREATE POLICY "Users can view budget salary additions"
  ON budget_salary_additions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert budget salary additions"
  ON budget_salary_additions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update budget salary additions"
  ON budget_salary_additions
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete budget salary additions"
  ON budget_salary_additions
  FOR DELETE
  TO authenticated
  USING (true);

-- Inserir dados iniciais - Turnos
INSERT INTO budget_turns (name, description) VALUES
  ('Diurno', 'Turno diurno - 6h às 18h'),
  ('Noturno', 'Turno noturno - 18h às 6h')
ON CONFLICT DO NOTHING;

-- Inserir dados iniciais - Adicionais Salariais
INSERT INTO budget_salary_additions (name, description, default_percentage, calculation_base) VALUES
  ('Insalubridade', 'Adicional por trabalho em condições insalubres', 20.00, 'minimum_wage'),
  ('Periculosidade', 'Adicional por trabalho em condições perigosas', 30.00, 'salary_base'),
  ('Adicional Noturno', 'Adicional por trabalho noturno', 20.00, 'salary_base'),
  ('Adicional de Função', 'Adicional por função de confiança', 15.00, 'salary_base'),
  ('Gratificação por Tempo', 'Gratificação por tempo de serviço', 10.00, 'salary_base')
ON CONFLICT DO NOTHING;

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_budget_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_budget_turns_updated_at
  BEFORE UPDATE ON budget_turns
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_updated_at();

CREATE TRIGGER update_budget_salary_additions_updated_at
  BEFORE UPDATE ON budget_salary_additions
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_updated_at();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_budget_turns_active ON budget_turns (is_active);
CREATE INDEX IF NOT EXISTS idx_budget_salary_additions_active ON budget_salary_additions (is_active);