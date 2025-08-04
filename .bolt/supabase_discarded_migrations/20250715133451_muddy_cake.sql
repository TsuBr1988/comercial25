/*
  # Inserir metas mensais padrão

  1. Configurações do Sistema
    - Inserir metas mensais padrão de R$ 300.000 para cada mês
    - Configurar sistema de comissões padrão
    - Preparar métricas de performance semanal

  2. Dados Padrão
    - 12 meses com R$ 300.000 cada
    - Total anual: R$ 3.600.000
    - Estrutura flexível para alterações futuras
*/

-- Inserir metas mensais padrão (R$ 300.000 por mês)
INSERT INTO system_configurations (config_type, config_data) 
VALUES (
  'monthly_goals',
  '[
    {"month": 1, "monthName": "janeiro", "targetValue": 300000},
    {"month": 2, "monthName": "fevereiro", "targetValue": 300000},
    {"month": 3, "monthName": "março", "targetValue": 300000},
    {"month": 4, "monthName": "abril", "targetValue": 300000},
    {"month": 5, "monthName": "maio", "targetValue": 300000},
    {"month": 6, "monthName": "junho", "targetValue": 300000},
    {"month": 7, "monthName": "julho", "targetValue": 300000},
    {"month": 8, "monthName": "agosto", "targetValue": 300000},
    {"month": 9, "monthName": "setembro", "targetValue": 300000},
    {"month": 10, "monthName": "outubro", "targetValue": 300000},
    {"month": 11, "monthName": "novembro", "targetValue": 300000},
    {"month": 12, "monthName": "dezembro", "targetValue": 300000}
  ]'::jsonb
) ON CONFLICT (config_type) DO UPDATE SET 
  config_data = EXCLUDED.config_data,
  updated_at = now();

-- Inserir configurações de comissão padrão
INSERT INTO system_configurations (config_type, config_data) 
VALUES (
  'commission_tiers',
  '[
    {"id": "1", "percentage": 0.4, "minValue": 0, "maxValue": 600000, "label": "0 - 600k"},
    {"id": "2", "percentage": 0.8, "minValue": 600000, "maxValue": 1200000, "label": "600k - 1,2M"},
    {"id": "3", "percentage": 1.2, "minValue": 1200000, "maxValue": null, "label": "Mais que 1,2M"}
  ]'::jsonb
) ON CONFLICT (config_type) DO UPDATE SET 
  config_data = EXCLUDED.config_data,
  updated_at = now();

-- Inserir métricas de performance semanal padrão
INSERT INTO system_configurations (config_type, config_data) 
VALUES (
  'weekly_metrics',
  '[
    {"id": "1", "name": "Propostas apresentadas", "points": 30, "role": "Closer"},
    {"id": "2", "name": "Conexões totais", "points": 1, "role": "Both"},
    {"id": "3", "name": "Contrato assinado", "points": 50, "role": "Closer"},
    {"id": "4", "name": "Contatos ativados", "points": 1, "role": "SDR"},
    {"id": "5", "name": "MQL", "points": 5, "role": "SDR"},
    {"id": "6", "name": "Visitas agendadas", "points": 10, "role": "SDR"}
  ]'::jsonb
) ON CONFLICT (config_type) DO UPDATE SET 
  config_data = EXCLUDED.config_data,
  updated_at = now();