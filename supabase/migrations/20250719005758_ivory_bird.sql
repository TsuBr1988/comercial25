/*
  # Create challenges table

  1. New Tables
    - `challenges`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text, optional)
      - `start_date` (date, required)
      - `end_date` (date, required)
      - `prize` (text, required)
      - `target_type` (enum: points, sales)
      - `target_value` (integer, required)
      - `status` (enum: active, completed, expired, default: active)
      - `participants_ids` (uuid array, optional)
      - `winner_ids` (uuid array, optional)
      - `completion_date` (timestamptz, optional)
      - `created_at` (timestamptz, auto-generated)
      - `updated_at` (timestamptz, auto-generated)

  2. Security
    - Enable RLS on `challenges` table
    - Add policy for authenticated users to read all challenges
    - Add policy for admins to manage challenges
*/

-- Create enum types if they don't exist
DO $$ BEGIN
    CREATE TYPE challenge_target_type AS ENUM ('points', 'sales');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE challenge_status AS ENUM ('active', 'completed', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  prize text NOT NULL,
  target_type challenge_target_type NOT NULL,
  target_value integer NOT NULL,
  status challenge_status DEFAULT 'active'::challenge_status,
  participants_ids uuid[],
  winner_ids uuid[],
  completion_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read challenges"
  ON challenges
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage challenges"
  ON challenges
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.user_metadata->>'role' = 'admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_challenges_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_challenges_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_challenges_target_type ON challenges(target_type);