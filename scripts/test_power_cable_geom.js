import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testPowerCables() {
    console.log("Checking power cables...")

    const { data, error } = await supabase
        .from('infrastructure_layers')
        .select('id, name, type, geom_geojson')
        .eq('type', 'power_cable')
        .limit(10)

    if (error) {
        console.error("Error:", error)
        return
    }

    if (data.length === 0) {
        console.log("No power cables found.")
        return
    }

    data.forEach(d => {
        const geo = d.geom_geojson
        if (!geo) {
            console.log(`[NULL] ${d.name}`)
        } else {
            console.log(`[OK] ${d.name} - Type: ${geo.type} - Coords: ${JSON.stringify(geo.coordinates).length} chars`)
        }
    })
}

testPowerCables()
