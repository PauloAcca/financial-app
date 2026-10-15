-- =========================================================
-- MIGRACIÓN 009 — ELIMINA "MES APLICADO"
-- Se quita la funcionalidad de aplicar un movimiento a otro mes.
-- Los movimientos que tenían applied_month pasan a quedar fechados
-- el día 1 del mes al que aplicaban, y luego se elimina la columna.
-- =========================================================

UPDATE transactions
SET occurred_at = date_trunc('month', applied_month)::date
WHERE applied_month IS NOT NULL;

DROP INDEX IF EXISTS idx_transactions_applied_month;

ALTER TABLE transactions DROP COLUMN IF EXISTS applied_month;
