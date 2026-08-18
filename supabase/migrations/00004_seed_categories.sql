-- =========================================================
-- MIGRACIÓN 004 — CATEGORÍAS DEL SISTEMA (SEED)
-- is_system = true, user_id = null
-- Se pueden leer por cualquier usuario autenticado (ver RLS policy).
-- =========================================================

insert into categories (name, kind, icon, color, is_system, user_id) values
  -- -------------------------------------------------------
  -- GASTOS
  -- -------------------------------------------------------
  ('Alimentación',     'expense', 'shopping-cart',   '#F59E0B', true, null),
  ('Transporte',       'expense', 'car',             '#3B82F6', true, null),
  ('Vivienda',         'expense', 'home',            '#8B5CF6', true, null),
  ('Servicios',        'expense', 'zap',             '#F97316', true, null),
  ('Salud',            'expense', 'heart-pulse',     '#EF4444', true, null),
  ('Entretenimiento',  'expense', 'tv',              '#EC4899', true, null),
  ('Delivery',         'expense', 'bike',            '#10B981', true, null),
  ('Ropa',             'expense', 'shirt',           '#6366F1', true, null),
  ('Educación',        'expense', 'graduation-cap',  '#0EA5E9', true, null),
  ('Suscripciones',    'expense', 'repeat',          '#A855F7', true, null),
  ('Bar y Restaurantes','expense','utensils',        '#D97706', true, null),
  ('Viajes',           'expense', 'plane',           '#14B8A6', true, null),
  ('Mascotas',         'expense', 'paw-print',       '#F472B6', true, null),
  ('Regalos',          'expense', 'gift',            '#FB923C', true, null),
  ('Otros gastos',     'expense', 'circle-ellipsis', '#6B7280', true, null),

  -- -------------------------------------------------------
  -- INGRESOS
  -- -------------------------------------------------------
  ('Sueldo',           'income',  'briefcase',       '#10B981', true, null),
  ('Freelance',        'income',  'laptop',          '#3B82F6', true, null),
  ('Inversiones',      'income',  'trending-up',     '#8B5CF6', true, null),
  ('Reembolso',        'income',  'rotate-ccw',      '#F59E0B', true, null),
  ('Regalo recibido',  'income',  'gift',            '#EC4899', true, null),
  ('Alquiler cobrado', 'income',  'home',            '#6366F1', true, null),
  ('Otros ingresos',   'income',  'circle-plus',     '#6B7280', true, null);
