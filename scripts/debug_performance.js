import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testPerformance() {
    console.log("Testing fetch performance for gas_pipeline (1000 rows)...")

    const start = Date.now()
    const { data, error } = await supabase
        .from('infrastructure_layers')
        .select('id, geom_geojson')
        .eq('type', 'gas_pipeline')
        .range(0, 999)

    const end = Date.now()
    const duration = (end - start) / 1000

    if (error) {
        console.error("Fetch failed:", error.message)
        return
    }

    console.log(`Fetched ${data.length} rows in ${duration.toFixed(2)}s`)

    // Calculate size
    const jsonStr = JSON.stringify(data)
    const sizeMB = jsonStr.length / (1024 * 1024)
    console.log(`Payload Size: ${sizeMB.toFixed(2)} MB`)

    if (data.length > 0) {
        console.log("Sample ID:", data[0].id)
        if (!data[0].geom_geojson) console.error("geom_geojson is NULL!")
    }
}

testPerformance()
