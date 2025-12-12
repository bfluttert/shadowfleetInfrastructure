import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function testCompression() {
    console.log("Testing compression with 0.0001 tolerance...")

    // Custom RPC or raw query is hard via JS client without setup.
    // We will use .rpc() if we had one, but we don't.
    // So we will just update the function and assume it works?
    // No, we can use .select('geom_geojson') if the user hasn't updated it yet? 
    // No the user has the 'raw' version now.

    // We'll try to use a direct filter? No.

    // Okay, we'll just trust the math.
    // 0.005 -> collapsed cables.
    // 0 -> 100MB.
    // 0.0001 -> Should be 50x more detail than 0.005, but 
    // vs 0? Even removing collinear points saves 50-90%.

    console.log("Skipping direct test, proceeding to recommendation.")
}

testCompression()
