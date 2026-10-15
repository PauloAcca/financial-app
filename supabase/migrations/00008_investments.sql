-- =========================================================
-- MIGRACIÓN 008 — INVERSIONES (VALUACIONES DE VALOR DE MERCADO)
-- Guarda "snapshots" del valor actual de una inversión/bóveda
-- (accounts.type = 'investment') a lo largo del tiempo.
-- El capital aportado se deduce del saldo inicial + movimientos;
-- el valor actual, de la última valuación. Así se puede calcular
-- la ganancia/pérdida y su porcentaje sin cargar "cuánto rinde".
-- =========================================================

CREATE TABLE IF NOT EXISTS investment_valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  value NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ARS',
  valued_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_investment_valuations_user ON investment_valuations(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_valuations_account
  ON investment_valuations(account_id, valued_at DESC, created_at DESC);

ALTER TABLE investment_valuations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "investment_valuations_own"
    ON investment_valuations FOR ALL
    USING (user_id = auth.uid());
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
