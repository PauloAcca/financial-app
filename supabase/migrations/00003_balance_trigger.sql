-- =========================================================
-- MIGRACIÓN 003 — TRIGGER DE BALANCE AUTOMÁTICO
-- Mantiene accounts.current_balance sincronizado con cada
-- INSERT / UPDATE / DELETE en la tabla transactions.
-- =========================================================

create or replace function update_account_balance()
returns trigger
language plpgsql
security definer
as $$
declare
  v_delta numeric(14,2);
begin
  -- -------------------------------------------------------
  -- DELETE: revertir el efecto de la transacción eliminada
  -- -------------------------------------------------------
  if (TG_OP = 'DELETE') then
    if OLD.type = 'income' then
      update accounts set current_balance = current_balance - OLD.amount
        where id = OLD.account_id;
    elsif OLD.type = 'expense' then
      update accounts set current_balance = current_balance + OLD.amount
        where id = OLD.account_id;
    elsif OLD.type = 'transfer' then
      update accounts set current_balance = current_balance + OLD.amount
        where id = OLD.account_id;
      update accounts set current_balance = current_balance - OLD.amount
        where id = OLD.transfer_account_id;
    end if;
    return OLD;
  end if;

  -- -------------------------------------------------------
  -- UPDATE: revertir efecto anterior y aplicar el nuevo
  -- -------------------------------------------------------
  if (TG_OP = 'UPDATE') then
    -- Revertir OLD
    if OLD.type = 'income' then
      update accounts set current_balance = current_balance - OLD.amount
        where id = OLD.account_id;
    elsif OLD.type = 'expense' then
      update accounts set current_balance = current_balance + OLD.amount
        where id = OLD.account_id;
    elsif OLD.type = 'transfer' then
      update accounts set current_balance = current_balance + OLD.amount
        where id = OLD.account_id;
      if OLD.transfer_account_id is not null then
        update accounts set current_balance = current_balance - OLD.amount
          where id = OLD.transfer_account_id;
      end if;
    end if;
    -- Continuar para aplicar NEW (sin return aquí)
  end if;

  -- -------------------------------------------------------
  -- INSERT y UPDATE (NEW): aplicar el efecto de la nueva fila
  -- -------------------------------------------------------
  if NEW.type = 'income' then
    update accounts set current_balance = current_balance + NEW.amount
      where id = NEW.account_id;
  elsif NEW.type = 'expense' then
    update accounts set current_balance = current_balance - NEW.amount
      where id = NEW.account_id;
  elsif NEW.type = 'transfer' then
    -- Cuenta origen pierde; cuenta destino gana
    update accounts set current_balance = current_balance - NEW.amount
      where id = NEW.account_id;
    if NEW.transfer_account_id is not null then
      update accounts set current_balance = current_balance + NEW.amount
        where id = NEW.transfer_account_id;
    end if;
  end if;

  return NEW;
end;
$$;

-- Trigger para INSERT
create trigger trg_balance_insert
  after insert on transactions
  for each row execute procedure update_account_balance();

-- Trigger para UPDATE
create trigger trg_balance_update
  after update on transactions
  for each row execute procedure update_account_balance();

-- Trigger para DELETE
create trigger trg_balance_delete
  after delete on transactions
  for each row execute procedure update_account_balance();
