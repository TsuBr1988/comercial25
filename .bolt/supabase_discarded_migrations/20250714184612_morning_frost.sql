/*
  # Criar usuário administrativo no Supabase

  1. Novo usuário administrativo
    - Email: auditoria@grupowws.com.br
    - Senha: Piguinha22@@
    - Role: admin
    
  2. Perfil administrativo
    - Criação automática do perfil
    - Permissões administrativas
    
  3. Funcionário administrativo (opcional)
    - Registro na tabela employees para completude
*/

-- Inserir usuário administrativo diretamente na tabela auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'auditoria@grupowws.com.br',
  crypt('Piguinha22@@', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Criar perfil administrativo
INSERT INTO user_profiles (
  user_id,
  email,
  name,
  role,
  created_at,
  updated_at
) 
SELECT 
  u.id,
  'auditoria@grupowws.com.br',
  'Auditoria Grupo WWS',
  'admin',
  now(),
  now()
FROM auth.users u 
WHERE u.email = 'auditoria@grupowws.com.br'
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = now();

-- Criar funcionário administrativo (opcional, para completude do sistema)
INSERT INTO employees (
  user_id,
  name,
  email,
  avatar,
  department,
  position,
  role,
  points,
  level,
  admission_date,
  created_at,
  updated_at
)
SELECT 
  u.id,
  'Auditoria Grupo WWS',
  'auditoria@grupowws.com.br',
  'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
  'Administração',
  'Auditor',
  'Admin',
  0,
  1,
  CURRENT_DATE,
  now(),
  now()
FROM auth.users u 
WHERE u.email = 'auditoria@grupowws.com.br'
ON CONFLICT (email) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  name = EXCLUDED.name,
  avatar = EXCLUDED.avatar,
  department = EXCLUDED.department,
  position = EXCLUDED.position,
  role = EXCLUDED.role,
  updated_at = now();