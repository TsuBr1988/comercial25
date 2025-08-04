/*
  # Fix challenges table migration

  1. New Tables
    - `challenges`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text, optional)
      - `start_date` (date, required)
      - `end_date` (date, required)
      - `prize` (text, required)
      - `target_type` (enum: points, sales, mql, visitas_agendadas, contratos_assinados, pontos_educacao)
      - `target_value` (integer, required)
      - `status` (enum: active, completed, expired)
      - `participants_ids` (text array, optional)
      - `winner_ids` (text array, optional)
      - `completion_date` (timestamptz, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `challenges` table
    - Add policies for authenticated users to read
    - Add policies for admins to insert/update/delete

  3. Changes
    - Use IF NOT EXISTS for type creation to avoid conflicts
    - Add all target types from the application
    - Use integer for target_value instead of numeric
    - Add proper constraints and indexes
*/

-- Create custom types (with IF NOT EXISTS equivalent)
DO $$ BEGIN
    CREATE TYPE target_type AS ENUM ('points', 'sales', 'mql', 'visitas_agendadas', 'contratos_assinados', 'pontos_educacao');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE challenge_status AS ENUM ('active', 'completed', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create challenges table
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
  participants_ids text[] DEFAULT '{}',
  winner_ids text[] DEFAULT '{}',
  completion_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraints
DO $$ BEGIN
    ALTER TABLE challenges ADD CONSTRAINT check_end_date_after_start_date 
      CHECK (end_date >= start_date);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE challenges ADD CONSTRAINT check_target_value_positive 
      CHECK (target_value > 0);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges (status);
CREATE INDEX IF NOT EXISTS idx_challenges_end_date ON challenges (end_date);
CREATE INDEX IF NOT EXISTS idx_challenges_start_date ON challenges (start_date);

-- Enable Row Level Security
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Create policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Allow all authenticated users to read challenges" ON challenges;
DROP POLICY IF EXISTS "Allow admins to insert challenges" ON challenges;
DROP POLICY IF EXISTS "Allow admins to update challenges" ON challenges;
DROP POLICY IF EXISTS "Allow admins to delete challenges" ON challenges;

CREATE POLICY "Allow all authenticated users to read challenges"
  ON challenges
  FOR SELECT
  TO authenticated
  USING (true);

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

-- Create trigger for updated_at (only if function exists)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
        DROP TRIGGER IF EXISTS update_challenges_updated_at ON challenges;
        CREATE TRIGGER update_challenges_updated_at
          BEFORE UPDATE ON challenges
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at();
    END IF;
END $$;