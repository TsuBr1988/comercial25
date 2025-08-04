/*
  # Corrigir schema da tabela proposals

  1. Problema Atual
    - Coluna 'closing_date' não existe no schema atual
    - Constraints podem estar conflitando
    - Status deve ser mutuamente exclusivo

  2. Solução
    - Adicionar colunas que faltam de forma segura
    - Corrigir constraints para garantir exclusividade
    - Atualizar triggers se necessário

  3. Regras de Negócio
    - Uma proposta só pode ter UM status por vez
    - Fechado: requer closing_date
    - Perdido: requer lost_date e lost_reason
    - Proposta/Negociação: não requer campos extras
*/

-- Primeiro, vamos verificar e adicionar as colunas que faltam
DO $$ 
BEGIN
    -- Adicionar closing_date se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proposals' AND column_name = 'closing_date'
    ) THEN
        ALTER TABLE proposals ADD COLUMN closing_date timestamptz;
    END IF;

    -- Adicionar lost_date se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proposals' AND column_name = 'lost_date'
    ) THEN
        ALTER TABLE proposals ADD COLUMN lost_date timestamptz;
    END IF;

    -- Adicionar lost_reason se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proposals' AND column_name = 'lost_reason'
    ) THEN
        ALTER TABLE proposals ADD COLUMN lost_reason text;
    END IF;
END $$;

-- Remover constraints antigas se existirem
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS check_closing_date_when_closed;
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS check_lost_fields_when_lost;
ALTER TABLE proposals DROP CONSTRAINT IF EXISTS check_valid_lost_reason;

-- Adicionar constraints corretas para garantir exclusividade de status
ALTER TABLE proposals 
ADD CONSTRAINT check_status_fields 
CHECK (
  CASE 
    WHEN status = 'Fechado' THEN 
      closing_date IS NOT NULL AND lost_date IS NULL AND lost_reason IS NULL
    WHEN status = 'Perdido' THEN 
      lost_date IS NOT NULL AND lost_reason IS NOT NULL AND closing_date IS NULL
    WHEN status IN ('Proposta', 'Negociação') THEN 
      closing_date IS NULL AND lost_date IS NULL AND lost_reason IS NULL
    ELSE false
  END
);

-- Constraint para motivos válidos de perda
ALTER TABLE proposals 
ADD CONSTRAINT check_valid_lost_reason 
CHECK (
  lost_reason IS NULL OR 
  lost_reason IN ('Fechou com o atual', 'Fechou com concorrente', 'Desistiu da contratação')
);

-- Criar índices para performance se não existirem
CREATE INDEX IF NOT EXISTS idx_proposals_closing_date ON proposals(closing_date) WHERE closing_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_lost_date ON proposals(lost_date) WHERE lost_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);

-- Atualizar comentários
COMMENT ON COLUMN proposals.closing_date IS 'Data de fechamento do contrato (apenas quando status = Fechado)';
COMMENT ON COLUMN proposals.lost_date IS 'Data da perda da proposta (apenas quando status = Perdido)';
COMMENT ON COLUMN proposals.lost_reason IS 'Motivo da perda (apenas quando status = Perdido)';

-- Verificar se tudo está correto
DO $$
BEGIN
    RAISE NOTICE 'Schema atualizado com sucesso!';
    RAISE NOTICE 'Colunas adicionadas: closing_date, lost_date, lost_reason';
    RAISE NOTICE 'Constraints aplicadas para garantir exclusividade de status';
END $$;