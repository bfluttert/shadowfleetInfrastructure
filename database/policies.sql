-- Enable RLS on tables (if not already)
alter table infrastructure_layers enable row level security;
alter table watch_list enable row level security;
alter table ais_positions enable row level security;

-- Policy 1: Allow Public Read access to infrastructure_layers
drop policy if exists "Public Read Infrastructure" on infrastructure_layers;
create policy "Public Read Infrastructure"
on infrastructure_layers for select
to anon, authenticated
using (true);

-- Policy 2: Allow Public Read access to ais_positions
drop policy if exists "Public Read Positions" on ais_positions;
create policy "Public Read Positions"
on ais_positions for select
to anon, authenticated
using (true);

-- Policy 3: Allow Public Read access to watch_list
drop policy if exists "Public Read Watchlist" on watch_list;
create policy "Public Read Watchlist"
on watch_list for select
to anon, authenticated
using (true);
