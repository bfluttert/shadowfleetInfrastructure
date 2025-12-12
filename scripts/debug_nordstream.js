import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function debugNordStream() {
    console.log("Searching for Nord Stream 2...")

    // 1. Get ID
    const { data: rows, error } = await supabase
        .from('infrastructure_layers')
        .select('id, name, geom') // Get raw geom to check if it exists
        .eq('name', 'Nord Stream 2')
        .limit(1)

    if (error || !rows || rows.length === 0) {
        console.error("Not found or error:", error)
        return
    }

    const row = rows[0]
    console.log(`Found ID: ${row.id}, Raw Geom Length: ${row.geom ? row.geom.length : 0}`)

    // 2. Test Computed Column
    console.log("Testing geom_geojson computed column...")
    const { data: computedData, error: computedError } = await supabase
        .from('infrastructure_layers')
        .select('id, geom_geojson')
        .eq('id', row.id)
        .single()

    if (computedError) {
        console.error("Computed Column Error:", computedError)
    } else {
        const geo = computedData.geom_geojson
        console.log("Computed GeoJSON:", JSON.stringify(geo).substring(0, 200) + "...")
        if (!geo) console.error("geo_geojson IS NULL!")
    }
}

debugNordStream()
