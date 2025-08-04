/*
  # Sistema de Perfis de Usuário

  1. Nova tabela user_profiles
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key para auth.users)
    - `email` (text, unique)
    - `name` (text)
    - `role` (enum: admin, closer, sdr)
    - `created_at` (timestamp)
    - `updated_at` (timestamp)

  2. Segurança
    - Enable RLS na tabela user_profiles
    - Políticas para usuários autenticados
    - Trigger para criar perfil automaticamente

  3. Função para criar perfil automaticamente
    - Trigger após inserção em auth.users
    - Associa com funcionário existente se email coincidir
*/

-- Criar enum para roles de usuário
CREATE TYPE user_role AS ENUM ('admin', 'closer', 'sdr');

-- Criar tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email text UNIQUE NOT NULL,
  name text,
  role user_role DEFAULT 'sdr',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can read their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user profiles"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
  );

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  employee_data RECORD;
  user_role_value user_role;
BEGIN
  -- Buscar funcionário com o mesmo email
  SELECT * INTO employee_data 
  FROM employees 
  WHERE email = NEW.email;
  
  -- Determinar role baseado no funcionário
  IF employee_data.role = 'Admin' THEN
    user_role_value := 'admin';
  ELSIF employee_data.role = 'Closer' THEN
    user_role_value := 'closer';
  ELSE
    user_role_value := 'sdr';
  END IF;
  
  -- Criar perfil do usuário
  INSERT INTO user_profiles (user_id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(employee_data.name, NEW.email),
    user_role_value
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Adicionar coluna user_id na tabela employees se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE employees ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;