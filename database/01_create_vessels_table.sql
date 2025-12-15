-- Create vessels table for Trust but Verify strategy
create table if not exists vessels (
  id bigint generated always as identity primary key,
  name text,
  imo bigint unique not null, -- The permanent ID
  mmsi bigint, -- The dynamic tracking ID
  status text check (status in ('active', 'mismatch', 'inactive')),
  last_verified timestamptz
);

-- Index for faster lookups
create index if not exists vessels_imo_idx on vessels (imo);
create index if not exists vessels_mmsi_idx on vessels (mmsi);
