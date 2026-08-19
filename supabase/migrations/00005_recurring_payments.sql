-- =========================================================
-- MIGRACIÓN 005 — RECURRING TRANSACTION PAYMENTS
-- Permite marcar gastos/ingresos recurrentes como pagados
-- mes a mes de forma manual, generando la transacción real.
-- =========================================================

create table recurring_transaction_payments (
  id                       uuid        primary key default gen_random_uuid(),
  recurring_transaction_id uuid        not null references recurring_transactions(id) on delete cascade,
  period                   text        not null,     -- 'YYYY-MM', ej: '2026-08'
  paid                     boolean     not null default false,
  paid_at                  timestamptz,
  transaction_id           uuid        references transactions(id) on delete set null,
  created_at               timestamptz not null default now(),
  unique (recurring_transaction_id, period)
);

create index idx_rtp_recurring on recurring_transaction_payments(recurring_transaction_id);
create index idx_rtp_period    on recurring_transaction_payments(period);

alter table recurring_transaction_payments enable row level security;

create policy "rtp_own"
  on recurring_transaction_payments for all
  using (
    recurring_transaction_id in (
      select id from recurring_transactions where user_id = auth.uid()
    )
  );
