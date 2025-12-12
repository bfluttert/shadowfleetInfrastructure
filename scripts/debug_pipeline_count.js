import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testPipelines() {
    console.log("Checking pipelines...")

    // 1. Total Count
    const { count } = await supabase
        .from('infrastructure_layers')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'gas_pipeline')

    console.log(`Total Pipelines in DB: ${count}`)

    // 2. Fetch all using geom_geojson and check for nulls
    console.log("Fetching all via geom_geojson...")
    const { data, error } = await supabase
        .from('infrastructure_layers')
        .select('id, name, geom_geojson')
        .eq('type', 'gas_pipeline')

    if (error) {
        console.log("Error fetching:", error.message)
        return
    }

    console.log(`Fetched ${data.length} rows.`)

    const invalid = data.filter(d => !d.geom_geojson || !d.geom_geojson.coordinates || d.geom_geojson.coordinates.length === 0)
    console.log(`Invalid/Empty Geometries after simplification: ${invalid.length}`)

    if (invalid.length > 0) {
        console.log("Sample invalid:", invalid[0].name)
    }

    const nordStream = data.find(d => d.name && d.name.includes('Nord Stream'))
    if (nordStream) {
        console.log("Nord Stream found in fetch.")
        console.log("Coords length:", nordStream.geom_geojson.coordinates.length)
    } else {
        console.log("Nord Stream NOT found in fetch batch.")
    }
}

testPipelines()
