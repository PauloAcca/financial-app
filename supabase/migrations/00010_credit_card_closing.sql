-- =========================================================
-- MIGRACIÓN 010 — CIERRE Y VENCIMIENTO DE TARJETA DE CRÉDITO
-- Cada cuenta de tipo 'credit_card' puede definir el día en que
-- cierra su resumen (normalmente el 1) y el día de vencimiento
-- (habitualmente entre el 7 y el 10). Las métricas agrupan los
-- gastos de tarjeta en el mes en que cierra el resumen.
-- =========================================================

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS closing_day INT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS due_day INT;

-- Valores por defecto para las tarjetas existentes
UPDATE accounts
SET closing_day = COALESCE(closing_day, 1),
    due_day = COALESCE(due_day, 10)
WHERE type = 'credit_card';
