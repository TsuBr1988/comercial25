/*
  # Atualizar weekly_performance com constraint UNIQUE correta

  1. Limpeza
    - Remove índices/constraints antigos conflitantes
  
  2. Constraint UNIQUE
    - Adiciona constraint correta para (employee_id, week_ending_date)
    - Permite ON CONFLICT funcionar no upsert
  
  3. Índices de Performance
    - Índice para consultas por data
    - Índice para consultas por funcionário
*/

-- 1.1 Remova índice/constraint antigos (se existirem)
DROP INDEX IF EXISTS weekly_performance_employee_week_unique;
ALTER TABLE public.weekly_performance
  DROP CONSTRAINT IF EXISTS weekly_performance_employee_week_unique;

-- 1.2 Crie a UNIQUE correta
ALTER TABLE public.weekly_performance
  ADD CONSTRAINT weekly_performance_employee_week_unique
  UNIQUE (employee_id, week_ending_date);

-- 1.3 Índices extras para performance
CREATE INDEX IF NOT EXISTS weekly_performance_week_ending_idx
  ON public.weekly_performance (week_ending_date);
CREATE INDEX IF NOT EXISTS weekly_performance_employee_idx
  ON public.weekly_performance (employee_id);