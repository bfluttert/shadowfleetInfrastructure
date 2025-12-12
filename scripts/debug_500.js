import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
// Use ANON key to match frontend constraints
const supabaseKey = process.env.VITE_SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testFetch(type) {
    console.log(`\nTesting fetch for type: ${type}`)

    // 1. Sanity Check
    const { count, error: errCount } = await supabase
        .from('infrastructure_layers')
        .select('id', { count: 'exact', head: true })
        .eq('type', type)

    if (errCount) {
        console.error("  [Sanity Check] Failed:", errCount.message)
        return
    }
    console.log(`  [Sanity Check] Found ${count} rows.`)

    if (count === 0) return

    // 2. STRESS TEST: Fetch ALL with geom_geojson
    console.log("  [Computed Col] Fetching id, geom_geojson (NO LIMIT)...")
    const { data, error } = await supabase
        .from('infrastructure_layers')
        .select('id, geom_geojson')
        .eq('type', type)
    // .limit(100) // NO LIMIT

    if (error) {
        console.error("  [Computed Col] FAILED:", error.code, error.message)
        if (error.details) console.error("  Details:", error.details)
    } else {
        console.log(`  [Computed Col] SUCCESS. Retrieved ${data.length} rows.`)
        // Check size roughly
        const size = JSON.stringify(data).length
        console.log(`  Approx Payload Size: ${(size / 1024 / 1024).toFixed(2)} MB`)
    }
}

async function run() {
    // await testFetch('wind_farm') 
    // await testFetch('cable')
    await testFetch('gas_pipeline')
}

run()
