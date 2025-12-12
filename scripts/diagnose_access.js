import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_KEY
const anonKey = process.env.VITE_SUPABASE_KEY // Assuming this is in .env now

if (!url || !serviceKey || !anonKey) {
    console.error("Missing keys in .env")
    console.log("URL:", !!url)
    console.log("ServiceKey:", !!serviceKey)
    console.log("AnonKey:", !!anonKey)
    process.exit(1)
}

async function check() {
    console.log("--- DIAGNOSTIC ---")

    // 1. Check Admin Access
    const adminClient = createClient(url, serviceKey)
    const { count: adminCount, error: adminError } = await adminClient
        .from('infrastructure_layers')
        .select('*', { count: 'exact', head: true })

    if (adminError) console.error("Admin Read Error:", adminError)
    else console.log(`[Admin/ServiceKey] Total Rows: ${adminCount}`)

    // 2. Check Public Access
    const publicClient = createClient(url, anonKey)
    const { count: publicCount, error: publicError } = await publicClient
        .from('infrastructure_layers')
        .select('*', { count: 'exact', head: true })

    if (publicError) console.error("Public/Anon Read Error:", publicError)
    else console.log(`[Public/Anon] Total Rows: ${publicCount}`)

    if (publicCount > 0) {
        const { data } = await publicClient.from('infrastructure_layers').select('id, geom::text').limit(1).single()
        console.log("Sample GEOM Type:", typeof data.geom)
        console.log("Sample GEOM Preview:", data.geom.substring(0, 50))
    }

}

check()
