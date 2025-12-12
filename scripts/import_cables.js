import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load env vars
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY are required.')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function importCables() {
    const filePath = path.join(__dirname, '..', 'data', 'cable-geo.json')

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`)
        console.log('Please download the cable-geo.json from Telegeography GitHub and place it in the data/ folder.')
        return
    }

    console.log('Reading GeoJSON...')
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const geojson = JSON.parse(fileContent)

    console.log(`Found ${geojson.features.length} features. Importing...`)

    let count = 0
    for (const feature of geojson.features) {
        const { name, slug, id } = feature.properties
        // Supabase/PostGIS expects GeoJSON geometry
        const { error } = await supabase
            .from('infrastructure_layers')
            .insert({
                name: name || slug || id,
                type: 'cable',
                status: 'active', // Assumed active for this dataset
                geom: feature.geometry // PostGIS handles GeoJSON geometry automatically if configured right, or we might need ST_GeomFromGeoJSON
            })

        if (error) {
            console.error('Error inserting:', feature.properties.name, error)
        } else {
            count++
            if (count % 50 === 0) console.log(`Imported ${count} cables...`)
        }
    }

    console.log(`Done! Imported ${count} cables.`)
}

importCables()
