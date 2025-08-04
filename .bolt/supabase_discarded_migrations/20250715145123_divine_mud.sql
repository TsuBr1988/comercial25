-- Script para verificar políticas RLS
-- Execute no Supabase SQL Editor antes de aplicar as migrações

-- 1. Verificar políticas existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'employees', 'weekly_performance', 'system_configurations')
ORDER BY tablename, policyname;

-- 2. Verificar constraints UNIQUE
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname IN ('weekly_performance', 'user_profiles', 'system_configurations')
  AND contype = 'u'
ORDER BY t.relname, conname;

-- 3. Verificar triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('user_profiles', 'weekly_performance', 'system_configurations')
ORDER BY event_object_table, trigger_name;

-- 4. Verificar enums
SELECT 
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('user_role', 'employee_role', 'proposal_status')
ORDER BY t.typname, e.enumsortorder;