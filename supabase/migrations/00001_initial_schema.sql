-- =========================================================
-- MIGRACIÓN 001 — SCHEMA INICIAL
-- App de Finanzas Personales — Multi-tenant + Supabase
-- =========================================================

-- Extensión para generar UUIDs
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- 1. PROFILES
-- Extiende auth.users con datos propios del usuario.
-- Se crea automáticamente vía trigger al registrarse.
-- ---------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  default_currency text not null default 'ARS',
  timezone text default 'America/Argentina/Buenos_Aires',
  created_at timestamptz not null default now()
);

-- Trigger: crear profile automáticamente al hacer signup
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, default_currency)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'ARS'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------------------------------------------------------
-- 2. ACCOUNTS
-- ---------------------------------------------------------
create type account_type as enum (
  'bank', 'mercado_pago', 'cash', 'credit_card', 'investment', 'other'
);

create table accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  type account_type not null,
  currency text not null default 'ARS',
  initial_balance numeric(14,2) not null default 0,
  current_balance numeric(14,2) not null default 0,
  color text,
  icon text,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_accounts_user on accounts(user_id);

-- ---------------------------------------------------------
-- 3. CATEGORIES
-- ---------------------------------------------------------
create type category_kind as enum ('income', 'expense');

create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,  -- null = sistema
  parent_id uuid references categories(id) on delete set null,
  name text not null,
  kind category_kind not null,
  icon text,
  color text,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_categories_user on categories(user_id);
create index idx_categories_parent on categories(parent_id);

-- ---------------------------------------------------------
-- 4. TRANSACTIONS
-- ---------------------------------------------------------
create type transaction_type as enum ('income', 'expense', 'transfer');
create type transaction_source as enum ('manual', 'chat', 'import', 'recurring');

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  type transaction_type not null,
  amount numeric(14,2) not null,
  currency text not null default 'ARS',
  description text,
  occurred_at date not null default current_date,
  transfer_account_id uuid references accounts(id) on delete set null,
  payment_method text,
  source transaction_source not null default 'manual',
  recurring_transaction_id uuid,
  created_at timestamptz not null default now()
);

create index idx_transactions_user_date on transactions(user_id, occurred_at desc);
create index idx_transactions_account on transactions(account_id);
create index idx_transactions_category on transactions(category_id);

-- ---------------------------------------------------------
-- 5. RECURRING_TRANSACTIONS
-- ---------------------------------------------------------
create type recurrence_frequency as enum ('daily', 'weekly', 'monthly', 'yearly');

create table recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  account_id uuid not null references accounts(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  type transaction_type not null,
  amount numeric(14,2) not null,
  currency text not null default 'ARS',
  description text not null,
  frequency recurrence_frequency not null,
  day_of_month int,
  next_run_date date not null,
  active boolean not null default true,
  is_subscription boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_recurring_user on recurring_transactions(user_id);
create index idx_recurring_next_run on recurring_transactions(next_run_date) where active;

-- FK lógica de transactions → recurring_transactions
alter table transactions
  add constraint fk_transactions_recurring
  foreign key (recurring_transaction_id) references recurring_transactions(id) on delete set null;

-- ---------------------------------------------------------
-- 6. BUDGETS
-- ---------------------------------------------------------
create type budget_period as enum ('weekly', 'monthly');

create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  amount numeric(14,2) not null,
  currency text not null default 'ARS',
  period budget_period not null default 'monthly',
  alert_threshold_pct int not null default 80,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, category_id, period)
);

create index idx_budgets_user on budgets(user_id);

-- ---------------------------------------------------------
-- 7. INSIGHTS
-- ---------------------------------------------------------
create type insight_type as enum ('alert', 'tip', 'summary', 'anomaly');

create table insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type insight_type not null,
  title text not null,
  message text not null,
  related_category_id uuid references categories(id) on delete set null,
  dismissed boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_insights_user on insights(user_id, dismissed);

-- ---------------------------------------------------------
-- 8. EXCHANGE_RATES
-- ---------------------------------------------------------
create table exchange_rates (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  from_currency text not null,
  to_currency text not null,
  rate numeric(14,4) not null,
  source text,   -- "oficial", "blue", "mep"
  unique (date, from_currency, to_currency, source)
);
