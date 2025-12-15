import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Error: Missing SUPABASE_URL or SUPABASE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function importVessels() {
    const csvPath = 'ImportversionListOfEUDesignatedVessels231025.csv';

    if (!fs.existsSync(csvPath)) {
        console.error(`CSV file not found: ${csvPath}`);
        process.exit(1);
    }

    const fileContent = fs.readFileSync(csvPath, 'utf8');

    Papa.parse(fileContent, {
        header: true,
        delimiter: ';',
        complete: async (results) => {
            const vessels = [];

            results.data.forEach(row => {
                const imo = row['IMO number ']?.trim();
                const name = row['Vessel name']?.trim();

                if (imo && name) {
                    vessels.push({
                        imo: parseInt(imo),
                        name: name,
                        mmsi: null, // Will be auto-discovered
                        status: 'active',
                        last_verified: null
                    });
                }
            });

            console.log(`Parsed ${vessels.length} vessels from CSV`);

            // Insert in batches to avoid overwhelming Supabase
            const batchSize = 100;
            for (let i = 0; i < vessels.length; i += batchSize) {
                const batch = vessels.slice(i, i + batchSize);

                const { data, error } = await supabase
                    .from('vessels')
                    .upsert(batch, {
                        onConflict: 'imo',
                        ignoreDuplicates: false
                    });

                if (error) {
                    console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
                } else {
                    console.log(`✅ Inserted batch ${i / batchSize + 1} (${batch.length} vessels)`);
                }
            }

            console.log(`\n🎉 Import complete! ${vessels.length} vessels added to database.`);
            console.log(`The backend will now auto-discover their MMSI numbers from the AIS stream.`);
        }
    });
}

importVessels();
