-- Add JSONB column for flexible metadata storage
ALTER TABLE infrastructure_layers 
ADD COLUMN IF NOT EXISTS attributes jsonb DEFAULT '{}'::jsonb;

-- We can drop specific columns if we want to rely purely on JSONB, 
-- but keeping 'medium' and 'country' as top-level is fine for indexing if needed later.
-- For now, we will store everything in 'attributes' for display flexibility.
