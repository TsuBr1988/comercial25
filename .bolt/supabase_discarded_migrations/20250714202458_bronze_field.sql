/*
  # Adicionar coluna proposals_closing_date_check

  1. Nova Coluna
    - `proposals_closing_date_check` (boolean) - Flag para validação de data de fechamento
    - Valor padrão: true
    - Permite NULL

  2. Funcionalidade
    - Controla se a validação de data de fechamento está ativa
    - Pode ser usada para bypass temporário de validações
    - Útil para migração de dados legados
*/

-- Adicionar a coluna proposals_closing_date_check
ALTER TABLE proposals 
ADD COLUMN proposals_closing_date_check boolean DEFAULT true;

-- Adicionar comentário explicativo
COMMENT ON COLUMN proposals.proposals_closing_date_check IS 'Flag para controlar validação de data de fechamento (true = validação ativa, false = bypass)';

-- Criar índice para performance (opcional)
CREATE INDEX IF NOT EXISTS idx_proposals_closing_date_check 
ON proposals(proposals_closing_date_check);

-- Atualizar registros existentes
UPDATE proposals 
SET proposals_closing_date_check = true 
WHERE proposals_closing_date_check IS NULL;

-- Verificar se a coluna foi criada corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'proposals' 
AND column_name = 'proposals_closing_date_check';

-- Mostrar alguns registros de exemplo
SELECT 
    id,
    client,
    status,
    closing_date,
    proposals_closing_date_check
FROM proposals 
LIMIT 5;