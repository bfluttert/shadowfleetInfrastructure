-- Computed Field for infrastructure_layers
-- Allows querying .select('*, geom_geojson')

create or replace function geom_geojson(rec infrastructure_layers)
returns json as $$
  -- Increased tolerance to 0.001 (~100m) to prevent 500 errors on large cables.
  -- Power cables were timing out with 0.0001.
  select st_asgeojson(st_simplify(rec.geom::geometry, 0.001))::json;
$$ language sql stable;

-- Computed Field for ais_positions
create or replace function geom_geojson(rec ais_positions)
returns json as $$
  select st_asgeojson(rec.geom)::json;
$$ language sql stable;
