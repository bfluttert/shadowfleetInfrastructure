-- Enable PostGIS
create extension if not exists postgis;

-- 4.1. infrastructure_layers
create table if not exists infrastructure_layers (
  id uuid default gen_random_uuid() primary key,
  name text,
  type text, -- 'cable', 'gas_pipeline', 'wind_farm'
  status text, -- 'active', 'planned'
  geom geography(Geometry, 4326)
);
create index if not exists infra_geo_idx on infrastructure_layers using GIST (geom);

-- 4.2. watch_list
create table if not exists watch_list (
  imo integer primary key,
  vessel_name text,
  risk_level text, -- 'high', 'sanctioned', 'suspected'
  notes text
);

-- 4.3. ais_positions
create table if not exists ais_positions (
  id bigint generated always as identity primary key,
  mmsi integer,
  imo integer references watch_list(imo),
  timestamp timestamptz default now(),
  geom geography(Point, 4326),
  speed_knots float,
  heading float,
  nav_status text
);
create index if not exists ais_geo_idx on ais_positions using GIST (geom);
create index if not exists ais_time_idx on ais_positions (timestamp);

-- 4.4. alerts
create table if not exists alerts (
  id uuid default gen_random_uuid() primary key,
  vessel_imo integer references watch_list(imo),
  alert_type text, -- 'loitering', 'proximity_cable', 'gap_detection'
  severity text, -- 'info', 'warning', 'critical'
  details jsonb,
  created_at timestamptz default now()
);
