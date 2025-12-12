import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function debugAttributes() {
    const types = ['military_area', 'port', 'wind_farm', 'nuclear_plant']

    for (const type of types) {
        console.log(`\n--- Checking ${type} ---`)
        const { data, error } = await supabase
            .from('infrastructure_layers')
            .select('name, attributes')
            .eq('type', type)
            .limit(1)

        if (data && data.length > 0) {
            const attr = data[0].attributes
            console.log("Keys:", Object.keys(attr))
            console.log("Sample:", JSON.stringify(attr, null, 2))
        } else {
            console.log("No data found.")
        }
    }
}

debugAttributes()
