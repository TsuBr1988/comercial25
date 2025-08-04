/*
  # Atualização da tabela weekly_performance

  1. Estrutura da Tabela
    - `id` (uuid, primary key)
    - `employee_id` (uuid, foreign key para employees)
    - `week_ending_date` (date, data da sexta-feira da semana)
    - `tarefas` (integer, tarefas realizadas)
    - `propostas_apresentadas` (integer, propostas apresentadas - Closers)
    - `conexoes` (integer, conexões realizadas - Closers)
    - `contrato_assinado` (integer, contratos assinados - Closers)
    - `contatos_ativados` (integer, contatos ativados - SDRs)
    - `mql` (integer, MQLs gerados - SDRs)
    - `visitas_agendadas` (integer, visitas agendadas - SDRs)
    - `conexoes_totais` (integer, conexões totais - SDRs)
    - `total_points` (integer, pontuação total calculada)
    - `created_at` (timestamp)
    - `updated_at` (timestamp)

  2. Segurança
    - Enable RLS na tabela weekly_performance
    - Políticas para usuários autenticados gerenciarem dados

  3. Índices
    - Índice único para employee_id + week_ending_date (evita duplicatas)
    - Índice para consultas por data
</parameter>

-- Verificar se a tabela já existe e criar se necessário
CREATE TABLE IF NOT EXISTS weekly_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  week_ending_date date NOT NULL,
  tarefas integer DEFAULT 0,
  propostas_apresentadas integer DEFAULT 0,
  conexoes integer DEFAULT 0,
  contrato_assinado integer DEFAULT 0,
  contatos_ativados integer DEFAULT 0,
  mql integer DEFAULT 0,
  visitas_agendadas integer DEFAULT 0,
  conexoes_totais integer DEFAULT 0,
  total_points integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE weekly_performance ENABLE ROW LEVEL SECURITY;

-- Criar índice único para evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS weekly_performance_employee_week_unique 
ON weekly_performance (employee_id, week_ending_date);

-- Criar índice para consultas por data
CREATE INDEX IF NOT EXISTS weekly_performance_week_date_idx 
ON weekly_performance (week_ending_date);

-- Criar políticas RLS
CREATE POLICY "Authenticated users can manage weekly_performance"
  ON weekly_performance
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_weekly_performance_updated_at ON weekly_performance;
CREATE TRIGGER update_weekly_performance_updated_at
  BEFORE UPDATE ON weekly_performance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();