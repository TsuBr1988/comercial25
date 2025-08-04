/*
  # Create Challenges and Rewards System

  1. New Tables
    - `challenges`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text, nullable)
      - `start_date` (date, not null)
      - `end_date` (date, not null)
      - `prize` (text, not null)
      - `target_type` (enum: points, sales)
      - `target_value` (numeric, not null)
      - `status` (enum: active, completed, expired)
      - `participants_ids` (uuid[], nullable)
      - `winner_ids` (uuid[], nullable)
      - `completion_date` (timestamptz, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `challenges` table
    - Add policies for authenticated users to read challenges
    - Add policies for admins to manage challenges
*/

-- Create custom types
CREATE TYPE target_type AS ENUM ('points', 'sales');
CREATE TYPE challenge_status AS ENUM ('active', 'completed', 'expired');

-- Create challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  prize text NOT NULL,
  target_type target_type NOT NULL,
  target_value numeric(12,2) NOT NULL,
  status challenge_status NOT NULL DEFAULT 'active',
  participants_ids uuid[] DEFAULT '{}',
  winner_ids uuid[] DEFAULT '{}',
  completion_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add constraints
ALTER TABLE challenges ADD CONSTRAINT check_end_date_after_start_date 
  CHECK (end_date >= start_date);

ALTER TABLE challenges ADD CONSTRAINT check_target_value_positive 
  CHECK (target_value > 0);

-- Add indexes
CREATE INDEX idx_challenges_status ON challenges (status);
CREATE INDEX idx_challenges_end_date ON challenges (end_date);
CREATE INDEX idx_challenges_start_date ON challenges (start_date);

-- Enable Row Level Security
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create trigger for updated_at
CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();