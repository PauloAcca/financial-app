-- =========================================================
-- MIGRACIÓN 007 — MES DE APLICACIÓN EN TRANSACCIONES
-- Permite desfasar el mes contable de una transacción respecto
-- de su fecha real. Ej: un sueldo cobrado el 31/08 se registra
-- con occurred_at = 2025-08-31 pero applied_month = 2025-09-01
-- para que las métricas lo agrupen en septiembre.
-- =========================================================

alter table transactions
  add column applied_month date;

comment on column transactions.applied_month is
  'Primer día del mes al que se aplica contablemente la transacción. NULL = usar occurred_at.';

-- Índice para agrupar/filtrar por mes aplicado en métricas.
create index idx_transactions_applied_month
  on transactions(user_id, applied_month)
  where applied_month is not null;
