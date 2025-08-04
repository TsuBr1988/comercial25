-- Script para testar upsert na weekly_performance
-- Execute após aplicar as migrações

-- 1. Inserir dados de teste
INSERT INTO employees (id, name, email, role, department, position)
VALUES 
  ('test-employee-1', 'João Teste', 'joao@test.com', 'Closer', 'Vendas', 'Closer'),
  ('test-employee-2', 'Maria Teste', 'maria@test.com', 'SDR', 'Vendas', 'SDR')
ON CONFLICT (email) DO NOTHING;

-- 2. Testar upsert (deve funcionar sem erro 42P10)
INSERT INTO weekly_performance (
  employee_id, 
  week_ending_date, 
  propostas_apresentadas, 
  conexoes_totais, 
  contrato_assinado,
  total_points
) VALUES 
  ('test-employee-1', '2025-01-17', 2, 10, 1, 90),
  ('test-employee-2', '2025-01-17', 0, 15, 0, 15)
ON CONFLICT (employee_id, week_ending_date) 
DO UPDATE SET 
  propostas_apresentadas = EXCLUDED.propostas_apresentadas,
  conexoes_totais = EXCLUDED.conexoes_totais,
  contrato_assinado = EXCLUDED.contrato_assinado,
  total_points = EXCLUDED.total_points,
  updated_at = now();

-- 3. Verificar se funcionou
SELECT 
  e.name,
  wp.week_ending_date,
  wp.total_points,
  wp.created_at,
  wp.updated_at
FROM weekly_performance wp
JOIN employees e ON wp.employee_id = e.id
WHERE wp.week_ending_date = '2025-01-17';

-- 4. Limpar dados de teste
DELETE FROM weekly_performance WHERE week_ending_date = '2025-01-17';
DELETE FROM employees WHERE email IN ('joao@test.com', 'maria@test.com');