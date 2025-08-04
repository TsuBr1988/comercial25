/*
  # Sistema de perfis de usuário completo

  1. Enum de Papéis
    - Cria tipo user_role com admin, closer, sdr
  
  2. Tabela user_profiles
    - Perfis de usuário com referência ao auth.users
    - Campos: id, user_id, email, name, role
  
  3. Triggers
    - updated_at automático
    - Criação automática de perfil quando usuário se registra
  
  4. Segurança RLS
    - Usuários podem ver/editar próprio perfil
    - Admins podem gerenciar todos os perfis
*/

-- 2.1 Enum de papéis
DO $$ BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
      CREATE TYPE user_role AS ENUM ('admin','closer','sdr');
   END IF;
END $$;

-- 2.2 Tabela
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT UNIQUE NOT NULL,
  name         TEXT,
  role         user_role DEFAULT 'sdr',
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- 2.3 Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- 2.4 RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Usuário autenticado lê o próprio perfil
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Usuário autenticado atualiza o próprio perfil
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins podem gerenciar todos os perfis
CREATE POLICY "Admins can manage all profiles"
  ON public.user_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
  );

-- 2.5 Função + trigger para criar perfil automático
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_email TEXT := NEW.email;
  v_name TEXT := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
BEGIN
  INSERT INTO public.user_profiles (user_id, email, name, role)
  VALUES (NEW.id, v_email, v_name, 'sdr')
  ON CONFLICT (email) DO UPDATE
     SET user_id = NEW.id;  -- Caso já exista funcionário com mesmo e-mail
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();