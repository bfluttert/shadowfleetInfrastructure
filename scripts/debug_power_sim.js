import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function debugPowerSim() {
    console.log("Checking power cable geom_geojson output...")

    // Fetch 20 power cables
    const { data, error } = await supabase
        .from('infrastructure_layers')
        .select('id, name, geom_geojson')
        .eq('type', 'power_cable')
        .limit(20)

    if (error) {
        console.error("Error:", error)
        return
    }

    let nullCount = 0
    let validCount = 0

    data.forEach(d => {
        if (!d.geom_geojson) {
            console.log(`[NULL] ${d.name}`)
            nullCount++
        } else {
            console.log(`[OK] ${d.name} (${JSON.stringify(d.geom_geojson).length} chars)`)
            validCount++
        }
    })

    console.log(`\nSummary: ${validCount} valid, ${nullCount} NULL`)
}

debugPowerSim()
