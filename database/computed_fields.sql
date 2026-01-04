-- Computed Field for infrastructure_layers
-- Allows querying .select('*, geom_geojson')

create or replace function geom_geojson(rec infrastructure_layers)
returns json as $$
  select st_asgeojson(
    st_simplify(
      rec.geom::geometry, 
      case 
        when rec.type in ('power_cable', 'telecom_cable', 'gas_pipeline') then 0.01 -- ~1km simplified
        else 0.001 -- ~100m simplified for points/small areas
      end
    )
  )::json;
$$ language sql stable;

-- Computed Field for ais_positions
create or replace function geom_geojson(rec ais_positions)
returns json as $$
  select st_asgeojson(rec.geom)::json;
$$ language sql stable;
