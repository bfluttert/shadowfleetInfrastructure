import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import csv from 'csv-parser'
import 'dotenv/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load env vars
// Note: We need SERVICE_KEY for writing if RLS is strict, but user provided SUPABASE_SERVICE_KEY in local.env
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY are required.')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function ingestWatchlist() {
    const filePath = path.join(__dirname, '..', 'ImportversionListOfEUDesignatedVessels231025.csv')

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`)
        return
    }

    const results = []

    fs.createReadStream(filePath)
        .pipe(csv({ separator: ';' }))
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            console.log(`Parsed ${results.length} rows. Uploading...`)

            let batch = []
            let imported = 0

            for (const row of results) {
                // Map columns
                // Headers: "Vessel name", "IMO number ", "Date of application"
                const imoRaw = row['IMO number '] || row['IMO number']
                const name = row['Vessel name']
                const date = row['Date of application']

                if (!imoRaw || !name) continue

                const imo = parseInt(imoRaw.replace(/\D/g, '')) // Remove non-digits
                if (isNaN(imo)) continue

                batch.push({
                    imo: imo,
                    vessel_name: name,
                    risk_level: 'sanctioned',
                    notes: `EU Designated Date: ${date}`
                })

                if (batch.length >= 100) {
                    const { error } = await supabase.from('watch_list').upsert(batch)
                    if (error) console.error('Error batch:', error)
                    imported += batch.length
                    batch = []
                    process.stdout.write('.')
                }
            }

            if (batch.length > 0) {
                const { error } = await supabase.from('watch_list').upsert(batch)
                if (error) console.error('Error batch:', error)
                imported += batch.length
            }

            console.log(`\nDone. Ingested ${imported} vessels into watch_list.`)
        })
}

ingestWatchlist()
