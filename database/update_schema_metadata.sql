-- Add new columns for extended metadata
ALTER TABLE infrastructure_layers 
ADD COLUMN IF NOT EXISTS medium text,
ADD COLUMN IF NOT EXISTS country text;

-- Update the computed function to include them (implicit via *) 
-- but check if explicit selection helps? 'select *' in function usually binds at creation time.
-- We might need to recreate the function if it used * expanded, 
-- BUT our function takes (rec infrastructure_layers) record, so it receives the whole new row structure dynamically.
-- The select in the fetch "select '*, geom_geojson'" handles the columns.

-- Just in case, grant permissions if new defaults are needed (not here).
