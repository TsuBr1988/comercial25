/*
  # Criar tabela de desafios

  1. Novas Tabelas
    - `challenges`
      - `id` (uuid, primary key)
      - `title` (text, título do desafio)
      - `description` (text, descrição opcional)
      - `start_date` (date, data de início)
      - `end_date` (date, data final)
      - `prize` (text, descrição do prêmio)
      - `target_type` (enum, tipo de meta)
      - `target_value` (numeric, valor da meta)
      - `status` (enum, status do desafio)
      - `participants_ids` (uuid[], IDs dos participantes)
      - `winner_ids` (uuid[], IDs dos vencedores)
      - `completion_date` (timestamptz, data de conclusão)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Enable RLS na tabela `challenges`
    - Políticas para leitura (todos autenticados)
    - Políticas para escrita (apenas admins)

  3. Índices
    - Índices para status, datas de início e fim
    - Constraints para validação de dados
*/

-- Verificar e criar tipos apenas se não existirem
DO $$ 
BEGIN
  -- Verificar se target_type já existe
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'target_type') THEN
    CREATE TYPE target_type AS ENUM ('points', 'sales', 'mql', 'visitas_agendadas', 'contratos_assinados');
  ELSE
    -- Se já existe, verificar se tem todos os valores necessários
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e 
      JOIN pg_type t ON e.enumtypid = t.oid 
      WHERE t.typname = 'target_type' AND e.enumlabel = 'mql'
    ) THEN
      ALTER TYPE target_type ADD VALUE 'mql';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e 
      JOIN pg_type t ON e.enumtypid = t.oid 
      WHERE t.typname = 'target_type' AND e.enumlabel = 'visitas_agendadas'
    ) THEN
      ALTER TYPE target_type ADD VALUE 'visitas_agendadas';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e 
      JOIN pg_type t ON e.enumtypid = t.oid 
      WHERE t.typname = 'target_type' AND e.enumlabel = 'contratos_assinados'
    ) THEN
      ALTER TYPE target_type ADD VALUE 'contratos_assinados';
    END IF;
  END IF;

  -- Verificar se challenge_status já existe
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'challenge_status') THEN
    CREATE TYPE challenge_status AS ENUM ('active', 'completed', 'expired');
  END IF;
END $$;

-- Criar tabela challenges se não existir
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  prize text NOT NULL,
  target_type target_type NOT NULL,
  target_value integer NOT NULL,
  status challenge_status NOT NULL DEFAULT 'active',
  participants_ids text[],
  winner_ids text[],
  completion_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Adicionar constraints apenas se não existirem
DO $$
BEGIN
  -- Constraint para data final após data inicial
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_end_date_after_start_date'
  ) THEN
    ALTER TABLE challenges ADD CONSTRAINT check_end_date_after_start_date 
      CHECK (end_date >= start_date);
  END IF;

  -- Constraint para valor da meta positivo
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_target_value_positive'
  ) THEN
    ALTER TABLE challenges ADD CONSTRAINT check_target_value_positive 
      CHECK (target_value > 0);
  END IF;
END $$;

-- Criar índices apenas se não existirem
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges (status);
CREATE INDEX IF NOT EXISTS idx_challenges_end_date ON challenges (end_date);
CREATE INDEX IF NOT EXISTS idx_challenges_start_date ON challenges (start_date);

-- Habilitar Row Level Security
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Criar políticas apenas se não existirem
DO $$
BEGIN
  -- Política de leitura
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'challenges' AND policyname = 'Allow all authenticated users to read challenges'
  ) THEN
    CREATE POLICY "Allow all authenticated users to read challenges"
      ON challenges
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  -- Política de inserção
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'challenges' AND policyname = 'Allow admins to insert challenges'
  ) THEN
    CREATE POLICY "Allow admins to insert challenges"
      ON challenges
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE user_id = auth.uid() 
          AND (
            auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
            OR 
            (auth.jwt() ->> 'user_metadata' ->> 'role' IS NULL AND email = 'auditoria@grupowws.com.br')
          )
        )
      );
  END IF;

  -- Política de atualização
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'challenges' AND policyname = 'Allow admins to update challenges'
  ) THEN
    CREATE POLICY "Allow admins to update challenges"
      ON challenges
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE user_id = auth.uid() 
          AND (
            auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
            OR 
            (auth.jwt() ->> 'user_metadata' ->> 'role' IS NULL AND email = 'auditoria@grupowws.com.br')
          )
        )
      );
  END IF;

  -- Política de exclusão
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'challenges' AND policyname = 'Allow admins to delete challenges'
  ) THEN
    CREATE POLICY "Allow admins to delete challenges"
      ON challenges
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM user_profiles 
          WHERE user_id = auth.uid() 
          AND (
            auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
            OR 
            (auth.jwt() ->> 'user_metadata' ->> 'role' IS NULL AND email = 'auditoria@grupowws.com.br')
          )
        )
      );
  END IF;
END $$;

-- Criar trigger para updated_at apenas se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_challenges_updated_at'
  ) THEN
    CREATE TRIGGER update_challenges_updated_at
      BEFORE UPDATE ON challenges
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;