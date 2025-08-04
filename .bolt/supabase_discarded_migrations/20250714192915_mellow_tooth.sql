/*
  # Adicionar campos para propostas perdidas

  1. Alterações na tabela proposals
    - Adicionar coluna `closing_date` (data de fechamento)
    - Adicionar coluna `lost_date` (data da perda)
    - Adicionar coluna `lost_reason` (motivo da perda)

  2. Atualizar enum proposal_status
    - Manter os valores existentes: 'Proposta', 'Negociação', 'Fechado', 'Perdido'

  3. Segurança
    - Manter RLS ativo
    - Manter políticas existentes
*/

-- Adicionar colunas para datas e motivo de perda
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS closing_date timestamptz,
ADD COLUMN IF NOT EXISTS lost_date timestamptz,
ADD COLUMN IF NOT EXISTS lost_reason text;

-- Adicionar constraint para lost_reason (valores válidos)
ALTER TABLE proposals 
ADD CONSTRAINT proposals_lost_reason_check 
CHECK (lost_reason IS NULL OR lost_reason IN ('Fechou com o atual', 'Fechou com concorrente', 'Desistiu da contratação'));

-- Adicionar constraint para garantir que closing_date só existe quando status = 'Fechado'
ALTER TABLE proposals 
ADD CONSTRAINT proposals_closing_date_check 
CHECK (
  (status = 'Fechado' AND closing_date IS NOT NULL) OR 
  (status != 'Fechado' AND closing_date IS NULL)
);

-- Adicionar constraint para garantir que lost_date e lost_reason só existem quando status = 'Perdido'
ALTER TABLE proposals 
ADD CONSTRAINT proposals_lost_fields_check 
CHECK (
  (status = 'Perdido' AND lost_date IS NOT NULL AND lost_reason IS NOT NULL) OR 
  (status != 'Perdido' AND lost_date IS NULL AND lost_reason IS NULL)
);

-- Criar índices para melhor performance nas consultas por data
CREATE INDEX IF NOT EXISTS idx_proposals_closing_date ON proposals(closing_date) WHERE closing_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_lost_date ON proposals(lost_date) WHERE lost_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_status_closing_date ON proposals(status, closing_date);

-- Comentários para documentação
COMMENT ON COLUMN proposals.closing_date IS 'Data em que o contrato foi efetivamente fechado (apenas para status Fechado)';
COMMENT ON COLUMN proposals.lost_date IS 'Data em que a proposta foi perdida (apenas para status Perdido)';
COMMENT ON COLUMN proposals.lost_reason IS 'Motivo pelo qual a proposta foi perdida (apenas para status Perdido)';