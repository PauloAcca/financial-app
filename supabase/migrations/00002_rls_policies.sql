-- =========================================================
-- MIGRACIÓN 002 — ROW LEVEL SECURITY
-- =========================================================

-- Habilitar RLS en todas las tablas con datos de usuario
alter table profiles enable row level security;
alter table accounts enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table recurring_transactions enable row level security;
alter table budgets enable row level security;
alter table insights enable row level security;
-- exchange_rates es data pública, sin RLS por usuario

-- ---------------------------------------------------------
-- PROFILES: solo el propio usuario
-- ---------------------------------------------------------
create policy "profiles_own"
  on profiles for all
  using (id = auth.uid());

-- ---------------------------------------------------------
-- ACCOUNTS: solo las propias
-- ---------------------------------------------------------
create policy "accounts_own"
  on accounts for all
  using (user_id = auth.uid());

-- ---------------------------------------------------------
-- CATEGORIES: ver propias + sistema; modificar solo propias
-- ---------------------------------------------------------
create policy "categories_select_own_or_system"
  on categories for select
  using (user_id = auth.uid() or is_system = true);

create policy "categories_insert_own"
  on categories for insert
  with check (user_id = auth.uid());

create policy "categories_update_own"
  on categories for update
  using (user_id = auth.uid());

create policy "categories_delete_own"
  on categories for delete
  using (user_id = auth.uid());

-- ---------------------------------------------------------
-- TRANSACTIONS: solo las propias
-- ---------------------------------------------------------
create policy "transactions_own"
  on transactions for all
  using (user_id = auth.uid());

-- ---------------------------------------------------------
-- RECURRING_TRANSACTIONS: solo las propias
-- ---------------------------------------------------------
create policy "recurring_own"
  on recurring_transactions for all
  using (user_id = auth.uid());

-- ---------------------------------------------------------
-- BUDGETS: solo los propios
-- ---------------------------------------------------------
create policy "budgets_own"
  on budgets for all
  using (user_id = auth.uid());

-- ---------------------------------------------------------
-- INSIGHTS: solo los propios
-- ---------------------------------------------------------
create policy "insights_own"
  on insights for all
  using (user_id = auth.uid());
