import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parseShp, parseDbf, combine } from 'shpjs'
import { stringify } from 'wellknown'
import 'dotenv/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load env vars
// Note: We need SERVICE_KEY for writing if RLS is strict, but user provided SUPABASE_SERVICE_KEY in local.env
// The user's env file might just have the anon key labelled as service key, but let's try.
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY are required.')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Mapping folder keywords to DB types
const TYPE_MAPPING = {
    'Cable': 'cable',
    'Pipeline': 'gas_pipeline',
    'WindFarm': 'wind_farm',
    'Wind': 'wind_farm',
    'Oil': 'platform', // e.g. OG_Offshore_Installations => platform
    'Gas': 'pipeline'
}

function determineType(filePath) {
    const lowerPath = filePath.toLowerCase()

    // Detailed Cable Types
    if (lowerPath.includes('cable')) {
        if (lowerPath.includes('power')) return 'power_cable'
        if (lowerPath.includes('telecom') || lowerPath.includes('communication')) return 'telecom_cable'
        return 'cable' // Generic fallback
    }

    if (lowerPath.includes('pipeline')) return 'gas_pipeline'
    if (lowerPath.includes('wind')) return 'wind_farm'
    if (lowerPath.includes('nuclear')) return 'nuclear_plant'
    if (lowerPath.includes('military')) return 'military_area'
    if (lowerPath.includes('port')) return 'port'

    // Platform detection (Oil/Gas installations)
    if (lowerPath.includes('oil') || lowerPath.includes('gas') || lowerPath.includes('platform') || lowerPath.includes('installation')) return 'platform'

    return 'unknown'
}

async function ingestFile(filePath) {
    console.log(`Processing ${filePath}...`)
    const layerType = determineType(filePath)
    console.log(`  > Detected Type: ${layerType}`)

    try {
        const buffer = fs.readFileSync(filePath)
        // shpjs can parse the .shp buffer, but usually needs the .dbf and .prj sidecars.
        // simpler method: pass the folder path to shpjs? No, shpjs usually takes a buffer of a zip or arraybuffer.
        // If we have separate files, we should read them.
        // However, `shp(buffer)` works if provided with the correct combo or zip.
        // Since we have unzipped files, we might need a specific handling.
        // `shp.parseShp(shpBuffer, [prjStr])` and `shp.parseDbf(dbfBuffer)`

        // Better strategy: Read the .shp and .dbf and .prj
        const shpPath = filePath
        const dbfPath = filePath.replace('.shp', '.dbf')
        const prjPath = filePath.replace('.shp', '.prj') // Optional

        if (!fs.existsSync(dbfPath)) {
            console.warn(`  > Skipping ${path.basename(filePath)}: .dbf missing.`)
            return
        }

        const shpBuffer = fs.readFileSync(shpPath)
        const dbfBuffer = fs.readFileSync(dbfPath)

        // We'll combine them using shpjs helper
        // combine([shp, dbf]) 
        const geojson = combine([
            parseShp(shpBuffer, fs.existsSync(prjPath) ? fs.readFileSync(prjPath, 'utf-8') : undefined),
            parseDbf(dbfBuffer)
        ])

        // result might be a FeatureCollection or array of them
        const features = geojson.features || geojson

        console.log(`  > Found ${features.length} features. Uploading...`)

        // Batch insert
        const BATCH_SIZE = 100
        let imported = 0
        let batch = []

        for (const feature of features) {
            // Fix geometry if needed (sometimes 2D/3D issues)

            // Helper to strip Z coordinates
            const force2D = (coords) => {
                if (!Array.isArray(coords)) return coords
                if (Array.isArray(coords[0])) {
                    return coords.map(force2D)
                }
                // It's a coordinate pair/triplet
                return coords.slice(0, 2)
            }

            // Mutate feature geometry to be 2D
            if (feature.geometry && feature.geometry.coordinates) {
                feature.geometry.coordinates = force2D(feature.geometry.coordinates)
            }

            const props = feature.properties || {}

            batch.push({
                name: props.NAME || props.Name || props.name || `Unititled ${layerType}`,
                type: layerType,
                status: props.STATUS || 'active',
                medium: props.PROD_MEDIA || props.MEDIUM || '',
                country: props.COUNTRY || props.CNTRY || '',
                attributes: props, // Store ALL properties
                geom: stringify(feature.geometry)
            })

            if (batch.length >= BATCH_SIZE) {
                const { error } = await supabase.from('infrastructure_layers').insert(batch)
                if (error) console.error('Error batch:', error)
                imported += batch.length
                batch = []
                process.stdout.write('.')
            }
        }

        // flushing last batch
        if (batch.length > 0) {
            const { error } = await supabase.from('infrastructure_layers').insert(batch)
            if (error) console.error('Error batch:', error)
            imported += batch.length
        }
        console.log(`\n  > Done. Imported ${imported} items.`)

    } catch (err) {
        console.error(`  > Error processing ${path.basename(filePath)}:`, err.message)
    }
}

async function scanAndIngest(dir) {
    const files = fs.readdirSync(dir)

    for (const file of files) {
        const fullPath = path.join(dir, file)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory()) {
            await scanAndIngest(fullPath)
        } else if (file.toLowerCase().endsWith('.shp')) {
            // Exclude Military Points as per user request
            if (file.includes('MilitaryAreas_pt')) {
                console.log(`Skipping Military Points file: ${file}`)
                continue
            }
            // Don't process xml helpers that end in .shp.xml, but file check handles that
            await ingestFile(fullPath)
        }
    }
}

// Start
const dataDir = path.join(__dirname, '..', 'data')
if (fs.existsSync(dataDir)) {
    console.log(`Scanning ${dataDir}...`)
    await scanAndIngest(dataDir)
} else {
    console.error(`Data dir not found: ${dataDir}`)
}
