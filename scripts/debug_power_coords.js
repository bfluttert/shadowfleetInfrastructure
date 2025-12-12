import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testPowerCoords() {
    console.log("Checking power cable coordinates...")

    const { data, error } = await supabase
        .from('infrastructure_layers')
        .select('name, geom_geojson')
        .eq('type', 'power_cable')
        .limit(1)

    if (data && data.length > 0) {
        const geo = data[0].geom_geojson
        console.log("Type:", geo.type)
        console.log("Coords Sample:", JSON.stringify(geo.coordinates))

        // Deep dive into values
        const flat = geo.coordinates.flat(Infinity)
        console.log("First X:", flat[0])
        console.log("First Y:", flat[1])
    }
}

testPowerCoords()
