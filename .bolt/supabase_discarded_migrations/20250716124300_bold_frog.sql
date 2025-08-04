```sql
-- 1. Atualizar a função is_admin() para ler a role do user_metadata
-- Esta função é crucial para as políticas RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Permite que a função ignore RLS para ler auth.users
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT (raw_user_meta_data->>'role') INTO user_role
  FROM auth.users
  WHERE id = auth.uid();

  RETURN user_role = 'admin';
END;
$$;

-- 2. Remover a coluna 'role' da tabela user_profiles
-- Certifique-se de que não há dependências diretas antes de executar
ALTER TABLE public.user_profiles DROP COLUMN role;

-- 3. Ajustar as políticas RLS na tabela user_profiles
-- As políticas agora dependerão apenas da função is_admin() ou de user_id = auth.uid()

-- Remover políticas antigas que podem referenciar a coluna 'role'
DROP POLICY IF EXISTS "user_profiles_admin_all" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;

-- Recriar políticas RLS para user_profiles
-- Permitir que o usuário autenticado faça SELECT apenas do seu próprio registro
CREATE POLICY "Allow logged-in users to read their own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Permitir INSERT caso precise criar perfil automaticamente
CREATE POLICY "Allow logged-in users to insert own profile"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Permitir que o usuário autenticado atualize seu próprio perfil
CREATE POLICY "Allow logged-in users to update own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Permitir que administradores gerenciem todos os perfis
CREATE POLICY "Admins can manage all user profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Opcional: Revalidar a tabela para garantir que as políticas RLS estão ativas
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
```