import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY are required.')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function clean() {
    console.log("Cleaning Military Area Points...")

    // Deleting rows where type is 'military_area' AND geometry type is Point/MultiPoint.
    // We can filter by ST_GeometryType(geom) in SQL, but Supabase JS client doesn't support complex PostGIS filters easily in .delete().
    // However, we can use the `rpc` if we had one, or raw SQL if enabled.
    // Or we can just fetch IDs of points and delete them.
    // Or simpler: The user said the 'military_area' points come from a specific file. 
    // If we only have that source, maybe we can delete based on attributes?
    // But geometry check is safer. 

    // Let's use a filter on the geom column if possible, but standard client doesn't do ST calls.
    // Workaround: Use a custom RPC or fetch all military areas, check type, delete.
    // fetching all military areas:

    const { data, error } = await supabase
        .from('infrastructure_layers')
        .select('id, geom_geojson')
        .eq('type', 'military_area')

    if (error) {
        console.error("Error fetching military areas:", error)
        return
    }

    console.log(`Found ${data.length} military areas. Checking geometry types...`)

    const toDelete = []
    for (const d of data) {
        if (!d.geom_geojson) continue
        const type = d.geom_geojson.type
        if (type === 'Point' || type === 'MultiPoint') {
            toDelete.push(d.id)
        }
    }

    console.log(`Identified ${toDelete.length} point features to remove.`)

    if (toDelete.length > 0) {
        const { error: delError } = await supabase
            .from('infrastructure_layers')
            .delete()
            .in('id', toDelete)

        if (delError) console.error("Error deleting:", delError)
        else console.log("Deletion complete.")
    } else {
        console.log("No point features found.")
    }
}

clean()
