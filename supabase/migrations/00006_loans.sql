-- =========================================================
-- MIGRACIÓN 006 — PRÉSTAMOS Y DEUDAS (LOANS)
-- Permite registrar dinero prestado a terceros o recibido en préstamo
-- sin descontar automáticamente del balance de la cuenta.
-- =========================================================

DO $$ BEGIN
  CREATE TYPE loan_type AS ENUM ('lent', 'borrowed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE loan_status AS ENUM ('pending', 'partial', 'paid');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  type loan_type NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  paid_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ARS',
  description TEXT,
  due_date DATE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  status loan_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  settled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_loans_user ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);

ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "loans_own"
    ON loans FOR ALL
    USING (user_id = auth.uid());
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Pagos / devoluciones de préstamos
CREATE TABLE IF NOT EXISTS loan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  paid_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loan_payments_loan ON loan_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_user ON loan_payments(user_id);

ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "loan_payments_own"
    ON loan_payments FOR ALL
    USING (user_id = auth.uid());
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
