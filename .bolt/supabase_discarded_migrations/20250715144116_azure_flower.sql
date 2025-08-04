/*
  # Seed de metas mensais padrão (R$ 300k)

  1. Tabela monthly_targets
    - Estrutura simples para metas mensais
    - month_year como chave única
  
  2. Seed de Dados
    - Insere metas de R$ 300k para todos os meses de 2025
    - ON CONFLICT DO NOTHING para não sobrescrever existentes
  
  3. Configurações do Sistema
    - Insere configurações padrão no system_configurations
    - Metas mensais, métricas semanais, faixas de comissão
*/

-- Estrutura simples para metas mensais
CREATE TABLE IF NOT EXISTS public.monthly_targets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month_year  DATE UNIQUE NOT NULL,
  target_br   NUMERIC DEFAULT 300000,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Inserir metas de 2025 (R$ 300k padrão)
INSERT INTO public.monthly_targets (month_year, target_br)
SELECT
  (date_trunc('year', '2025-01-01'::date) + (interval '1 month' * gs.month_index))::date,
  300000
FROM generate_series(0,11) as gs(month_index)
ON CONFLICT (month_year) DO NOTHING;

-- Inserir configurações padrão no system_configurations
INSERT INTO public.system_configurations (config_type, config_data)
VALUES 
  -- Metas mensais padrão
  ('monthly_goals', '[
    {"month": 1, "monthName": "Janeiro", "targetValue": 300000},
    {"month": 2, "monthName": "Fevereiro", "targetValue": 300000},
    {"month": 3, "monthName": "Março", "targetValue": 300000},
    {"month": 4, "monthName": "Abril", "targetValue": 300000},
    {"month": 5, "monthName": "Maio", "targetValue": 300000},
    {"month": 6, "monthName": "Junho", "targetValue": 300000},
    {"month": 7, "monthName": "Julho", "targetValue": 300000},
    {"month": 8, "monthName": "Agosto", "targetValue": 300000},
    {"month": 9, "monthName": "Setembro", "targetValue": 300000},
    {"month": 10, "monthName": "Outubro", "targetValue": 300000},
    {"month": 11, "monthName": "Novembro", "targetValue": 300000},
    {"month": 12, "monthName": "Dezembro", "targetValue": 300000}
  ]'::jsonb),
  
  -- Faixas de comissão padrão
  ('commission_tiers', '[
    {"id": "1", "percentage": 0.4, "minValue": 0, "maxValue": 600000, "label": "0 - 600k"},
    {"id": "2", "percentage": 0.8, "minValue": 600000, "maxValue": 1200000, "label": "600k - 1.2mi"},
    {"id": "3", "percentage": 1.2, "minValue": 1200000, "maxValue": null, "label": "Acima 1.2mi"}
  ]'::jsonb),
  
  -- Métricas semanais padrão
  ('weekly_metrics', '[
    {"id": "1", "name": "Propostas apresentadas", "points": 30, "role": "Closer"},
    {"id": "2", "name": "Conexões totais", "points": 1, "role": "Both"},
    {"id": "3", "name": "Contrato assinado", "points": 50, "role": "Closer"},
    {"id": "4", "name": "Contatos ativados", "points": 1, "role": "SDR"},
    {"id": "5", "name": "MQL", "points": 5, "role": "SDR"},
    {"id": "6", "name": "Visitas agendadas", "points": 10, "role": "SDR"}
  ]'::jsonb)
ON CONFLICT (config_type) DO NOTHING;