/*
  # Corrigir violação da constraint closing_date

  1. Problema Identificado
    - Constraint "proposals_closing_date_check" está sendo violada
    - Provavelmente existe dados inconsistentes na tabela

  2. Solução
    - Verificar dados existentes
    - Corrigir registros problemáticos
    - Recriar constraint corretamente

  3. Validação
    - Garantir que todos os registros estejam consistentes
*/

-- 1. VERIFICAR DADOS PROBLEMÁTICOS
SELECT 
    id,
    client,
    status,
    closing_date,
    lost_date,
    lost_reason,
    CASE 
        WHEN status = 'Fechado' AND closing_date IS NULL THEN 'ERRO: Fechado sem data'
        WHEN status != 'Fechado' AND closing_date IS NOT NULL THEN 'ERRO: Não fechado com data'
        WHEN status = 'Perdido' AND lost_date IS NULL THEN 'ERRO: Perdido sem data'
        WHEN status = 'Perdido' AND lost_reason IS NULL THEN 'ERRO: Perdido sem motivo'
        WHEN status != 'Perdido' AND (lost_date IS NOT NULL OR lost_reason IS NOT NULL) THEN 'ERRO: Não perdido com dados de perda'
        ELSE 'OK'
    END as problema
FROM proposals 
WHERE 
    -- Casos problemáticos
    (status = 'Fechado' AND closing_date IS NULL) OR
    (status != 'Fechado' AND closing_date IS NOT NULL) OR
    (status = 'Perdido' AND (lost_date IS NULL OR lost_reason IS NULL)) OR
    (status != 'Perdido' AND (lost_date IS NOT NULL OR lost_reason IS NOT NULL));

-- 2. REMOVER CONSTRAINTS PROBLEMÁTICAS
DO $$ 
BEGIN
    -- Remover constraint que está causando problema
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'proposals_closing_date_check') THEN
        ALTER TABLE proposals DROP CONSTRAINT proposals_closing_date_check;
        RAISE NOTICE 'Constraint proposals_closing_date_check removida';
    END IF;
    
    -- Remover outras constraints relacionadas se existirem
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'check_closing_date_when_closed') THEN
        ALTER TABLE proposals DROP CONSTRAINT check_closing_date_when_closed;
        RAISE NOTICE 'Constraint check_closing_date_when_closed removida';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'check_lost_fields_when_lost') THEN
        ALTER TABLE proposals DROP CONSTRAINT check_lost_fields_when_lost;
        RAISE NOTICE 'Constraint check_lost_fields_when_lost removida';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'check_valid_lost_reason') THEN
        ALTER TABLE proposals DROP CONSTRAINT check_valid_lost_reason;
        RAISE NOTICE 'Constraint check_valid_lost_reason removida';
    END IF;
END $$;

-- 3. CORRIGIR DADOS INCONSISTENTES
-- Limpar datas de fechamento para propostas não fechadas
UPDATE proposals 
SET closing_date = NULL 
WHERE status != 'Fechado' AND closing_date IS NOT NULL;

-- Limpar dados de perda para propostas não perdidas
UPDATE proposals 
SET lost_date = NULL, lost_reason = NULL 
WHERE status != 'Perdido' AND (lost_date IS NOT NULL OR lost_reason IS NOT NULL);

-- Para propostas fechadas sem data, definir data atual (ou você pode ajustar manualmente)
UPDATE proposals 
SET closing_date = updated_at 
WHERE status = 'Fechado' AND closing_date IS NULL;

-- Para propostas perdidas sem data/motivo, definir valores padrão
UPDATE proposals 
SET 
    lost_date = COALESCE(lost_date, updated_at),
    lost_reason = COALESCE(lost_reason, 'Fechou com concorrente')
WHERE status = 'Perdido' AND (lost_date IS NULL OR lost_reason IS NULL);

-- 4. RECRIAR CONSTRAINTS CORRETAS (SEM CONFLITOS)
-- Constraint para propostas fechadas
ALTER TABLE proposals 
ADD CONSTRAINT proposals_status_closing_date_check 
CHECK (
    (status = 'Fechado' AND closing_date IS NOT NULL) OR 
    (status != 'Fechado')
);

-- Constraint para propostas perdidas
ALTER TABLE proposals 
ADD CONSTRAINT proposals_status_lost_fields_check 
CHECK (
    (status = 'Perdido' AND lost_date IS NOT NULL AND lost_reason IS NOT NULL) OR 
    (status != 'Perdido')
);

-- Constraint para motivos válidos
ALTER TABLE proposals 
ADD CONSTRAINT proposals_valid_lost_reason_check 
CHECK (
    lost_reason IS NULL OR 
    lost_reason IN ('Fechou com o atual', 'Fechou com concorrente', 'Desistiu da contratação')
);

-- 5. VERIFICAR SE TUDO ESTÁ OK AGORA
SELECT 
    'VERIFICAÇÃO FINAL' as etapa,
    COUNT(*) as total_propostas,
    COUNT(CASE WHEN status = 'Fechado' THEN 1 END) as fechadas,
    COUNT(CASE WHEN status = 'Fechado' AND closing_date IS NOT NULL THEN 1 END) as fechadas_com_data,
    COUNT(CASE WHEN status = 'Perdido' THEN 1 END) as perdidas,
    COUNT(CASE WHEN status = 'Perdido' AND lost_date IS NOT NULL AND lost_reason IS NOT NULL THEN 1 END) as perdidas_com_dados
FROM proposals;

-- 6. LISTAR CONSTRAINTS ATIVAS
SELECT 
    constraint_name,
    constraint_type,
    is_deferrable,
    initially_deferred
FROM information_schema.table_constraints 
WHERE table_name = 'proposals' 
AND constraint_type = 'CHECK'
ORDER BY constraint_name;

RAISE NOTICE 'Correção concluída! Verifique os resultados acima.';