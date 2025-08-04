/*
  # Tabela system_configurations com UNIQUE constraint

  1. Tabela Principal
    - Armazena configurações do sistema em JSONB
    - config_type como chave única
  
  2. Constraint UNIQUE
    - Evita duplicatas por tipo de configuração
    - Permite upsert seguro
  
  3. Triggers
    - updated_at automático
  
  4. Segurança RLS
    - Usuários autenticados podem ler configurações
    - Apenas admins podem modificar
*/

CREATE TABLE IF NOT EXISTS public.system_configurations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type  TEXT NOT NULL,
  config_data  JSONB NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Evita duplicatas e permite upsert
ALTER TABLE public.system_configurations
  ADD CONSTRAINT system_config_type_unique UNIQUE (config_type);

-- Trigger updated_at (reaproveita a já criada)
CREATE TRIGGER trg_sysconfig_updated_at
BEFORE UPDATE ON public.system_configurations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.system_configurations ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem ler configurações
CREATE POLICY "Authenticated users can read system configurations"
  ON public.system_configurations
  FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admins podem modificar configurações
CREATE POLICY "Admins can manage system configurations"
  ON public.system_configurations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
  );