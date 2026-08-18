-- Phase 1: Custom Production order workflow.
-- Run this once in the Supabase SQL editor (or via `supabase db push` if
-- you're using the Supabase CLI with this repo).
--
-- Access model: the browser never talks to these tables directly. Every
-- read and write goes through this project's Vercel serverless functions
-- (api/_lib/supabaseAdmin.js), which authenticate with the server-only
-- SUPABASE_SECRET_KEY. That key bypasses Row Level Security by design, so
-- RLS is enabled below with intentionally NO policies — that is a "deny
-- all direct access" posture, not RLS left off. If a future phase ever
-- lets the browser query these tables directly (e.g. the client-side
-- Supabase publishable key), add a narrowly-scoped policy at that time —
-- e.g. a SELECT policy on custom_orders keyed to access_token for a
-- customer polling their own order.

create extension if not exists pgcrypto;

create type order_status as enum (
  'REQUEST_SUBMITTED',
  'QUOTE_APPROVED',
  'DEPOSIT_DUE',
  'DEPOSIT_PAID',
  'IN_PRODUCTION',
  'PRODUCTION_COMPLETE',
  'BALANCE_DUE',
  'PAID_IN_FULL',
  'READY_TO_SHIP',
  'SHIPPED',
  'COMPLETED'
);

-- Customer-facing order numbers start at WUSP-10001 and never expose the
-- underlying database id.
create sequence if not exists custom_order_number_seq start with 10001 increment by 1;

create table if not exists custom_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default ('WUSP-' || nextval('custom_order_number_seq')::text),
  -- Opaque lookup key for the customer-facing status page — deliberately
  -- NOT the sequential order_number, which is trivially guessable.
  access_token text unique not null default encode(gen_random_bytes(24), 'hex'),
  status order_status not null default 'REQUEST_SUBMITTED',

  product_name text not null,
  strength text not null,
  quantity integer not null check (quantity >= 100),

  -- Client-submitted estimate only (same resolveTier/unitPriceFor logic
  -- the catalog already uses) — never treated as authoritative pricing.
  unit_price numeric(10,2),
  order_subtotal numeric(10,2),

  testing_option text not null default 'none' check (testing_option in ('none','standard','standard_sterility')),
  -- Null until an admin confirms it (no testing pricing exists in the
  -- codebase yet) — the customer- and admin-facing UI both render this
  -- as "Price confirmed after request" while it's null.
  testing_price numeric(10,2),

  -- Set by an admin at Approve Quote time, once testing_price (if any) is
  -- confirmed: order_subtotal + testing_price.
  order_total numeric(10,2),

  deposit_required boolean not null default true,
  deposit_amount numeric(10,2),
  deposit_status text not null default 'PENDING' check (deposit_status in ('PENDING','PAID')),
  deposit_paid_at timestamptz,

  balance_amount numeric(10,2),
  balance_status text not null default 'PENDING' check (balance_status in ('PENDING','PAID')),
  balance_paid_at timestamptz,

  customer_name text not null,
  customer_company text not null,
  customer_email text not null,
  customer_phone text,
  customer_message text,

  tracking_carrier text,
  tracking_number text,
  shipped_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists custom_orders_status_idx on custom_orders(status);
create index if not exists custom_orders_access_token_idx on custom_orders(access_token);
create index if not exists custom_orders_created_at_idx on custom_orders(created_at desc);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists custom_orders_set_updated_at on custom_orders;
create trigger custom_orders_set_updated_at
  before update on custom_orders
  for each row execute function set_updated_at();

-- Append-only status/audit history — also what the "customer should
-- eventually understand exactly where the order stands" requirement and
-- the admin's status timeline are both built from.
create table if not exists custom_order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references custom_orders(id) on delete cascade,
  from_status order_status,
  to_status order_status not null,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists custom_order_events_order_id_idx on custom_order_events(order_id);

-- Allow-list of admin accounts. Supabase Auth's auth.users table holds
-- login identity; this table is the explicit "is this user actually an
-- authorized admin" check our API performs on every admin request — not
-- just "did they log in successfully somewhere." Add a second admin
-- later by creating their Supabase Auth user (dashboard) and inserting
-- one row here — no code changes required.
create table if not exists admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

alter table custom_orders enable row level security;
alter table custom_order_events enable row level security;
alter table admin_profiles enable row level security;

-- No policies are created intentionally — see the note at the top of this
-- file. With RLS enabled and zero policies, the publishable key (used
-- client-side only for Auth) has zero read/write access to these tables
-- even by accident.

-- ── ONE-TIME SETUP: after running this migration ──────────────────────────
-- 1. In Supabase Auth, create the first admin user (email + password).
-- 2. Run, substituting that user's email:
--
--   insert into admin_profiles (id, name)
--   select id, 'Admin Name' from auth.users where email = 'admin@wholesaleuspeptides.com';
