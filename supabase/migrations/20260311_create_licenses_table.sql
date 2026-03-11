-- Create licenses table
create table if not exists licenses (
  id          uuid        primary key default gen_random_uuid(),
  license_key text        not null unique,
  is_active   boolean     not null default false,
  device_id   text,
  created_at  timestamptz not null default now(),
  activated_at timestamptz
);

-- Index on license_key for fast lookups
create index if not exists idx_licenses_license_key on licenses (license_key);
