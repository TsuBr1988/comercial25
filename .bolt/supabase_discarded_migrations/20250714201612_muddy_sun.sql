/*
  # Adicionar colunas para datas e motivos nas propostas

  1. Novas Colunas
    - `closing_date` (timestamptz) - Data de fechamento do contrato
    - `lost_date` (timestamptz) - Data em que perdemos a proposta
    - `lost_reason` (text) - Motivo pelo qual perdemos a proposta

  2. Constraints de Validação
    - Closing date obrigatória quando status = 'Fechado'
    - Lost date e reason obrigatórias quando status = 'Perdido'
    - Lost reason deve ser um dos valores válidos

  3. Índices para Performance
    - Índices nas novas colunas para consultas rápidas
*/

-- Adicionar as novas colunas na tabela proposals
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS closing_date timestamptz,
ADD COLUMN IF NOT EXISTS lost_date timestamptz,
ADD COLUMN IF NOT EXISTS lost_reason text;

-- Adicionar constraints de validação

-- 1. Quando status = 'Fechado', closing_date deve estar preenchida
ALTER TABLE proposals 
ADD CONSTRAINT check_closing_date_required 
CHECK (
  (status = 'Fechado' AND closing_date IS NOT NULL) OR 
  (status != 'Fechado')
);

-- 2. Quando status = 'Perdido', lost_date e lost_reason devem estar preenchidas
ALTER TABLE proposals 
ADD CONSTRAINT check_lost_fields_required 
CHECK (
  (status = 'Perdido' AND lost_date IS NOT NULL AND lost_reason IS NOT NULL) OR 
  (status != 'Perdido')
);

-- 3. Lost reason deve ser um dos valores válidos
ALTER TABLE proposals 
ADD CONSTRAINT check_valid_lost_reason 
CHECK (
  lost_reason IS NULL OR 
  lost_reason IN (
    'Fechou com o atual',
    'Fechou com concorrente', 
    'Desistiu da contratação'
  )
);

-- 4. Closing date não pode ser no futuro
ALTER TABLE proposals 
ADD CONSTRAINT check_closing_date_not_future 
CHECK (
  closing_date IS NULL OR 
  closing_date <= NOW()
);

-- 5. Lost date não pode ser no futuro
ALTER TABLE proposals 
ADD CONSTRAINT check_lost_date_not_future 
CHECK (
  lost_date IS NULL OR 
  lost_date <= NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_proposals_closing_date 
ON proposals(closing_date) 
WHERE closing_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_proposals_lost_date 
ON proposals(lost_date) 
WHERE lost_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_proposals_status_dates 
ON proposals(status, closing_date, lost_date);

CREATE INDEX IF NOT EXISTS idx_proposals_lost_reason 
ON proposals(lost_reason) 
WHERE lost_reason IS NOT NULL;

-- Adicionar comentários para documentação
COMMENT ON COLUMN proposals.closing_date IS 'Data em que o contrato foi efetivamente fechado (obrigatória quando status = Fechado)';
COMMENT ON COLUMN proposals.lost_date IS 'Data em que perdemos a proposta (obrigatória quando status = Perdido)';
COMMENT ON COLUMN proposals.lost_reason IS 'Motivo pelo qual perdemos a proposta: "Fechou com o atual", "Fechou com concorrente", "Desistiu da contratação"';

-- Atualizar a função de trigger para calcular comissão (se necessário)
-- Garantir que propostas perdidas não tenham comissão
CREATE OR REPLACE FUNCTION update_proposal_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a proposta foi perdida, zerar a comissão
  IF NEW.status = 'Perdido' THEN
    NEW.commission = 0;
    NEW.commission_rate = 0;
  ELSE
    -- Calcular comissão normal baseada no valor mensal
    IF NEW.monthly_value >= 100000 THEN
      NEW.commission_rate = 1.2;
    ELSIF NEW.monthly_value >= 50000 THEN
      NEW.commission_rate = 0.8;
    ELSE
      NEW.commission_rate = 0.4;
    END IF;
    
    NEW.commission = (NEW.monthly_value * NEW.months * NEW.commission_rate) / 100;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar o trigger na tabela proposals (se não existir)
DROP TRIGGER IF EXISTS trigger_update_proposal_commission ON proposals;
CREATE TRIGGER trigger_update_proposal_commission
  BEFORE INSERT OR UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_proposal_commission();

-- Verificar se as colunas foram criadas corretamente
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'proposals' 
  AND column_name IN ('closing_date', 'lost_date', 'lost_reason')
ORDER BY ordinal_position;

-- Mostrar as constraints criadas
SELECT 
  constraint_name,
  constraint_type,
  check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%closing%' 
   OR constraint_name LIKE '%lost%'
ORDER BY constraint_name;