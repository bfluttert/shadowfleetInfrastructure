import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Error: Missing SUPABASE_URL or SUPABASE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkVessels() {
    console.log("Checking vessels table...\n");

    // 1. Count all vessels
    const { count: total, error: countError } = await supabase
        .from('vessels')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error("❌ Error counting vessels:", countError.message);
        console.log("\nHint: Make sure the 'vessels' table exists. Run database/01_create_vessels_table.sql in Supabase SQL Editor.");
        return;
    }

    console.log(`📊 Total vessels in table: ${total || 0}`);

    // 2. Count by status
    const { data: statusCounts, error: statusError } = await supabase
        .from('vessels')
        .select('status');

    if (!statusError && statusCounts) {
        const counts = statusCounts.reduce((acc, v) => {
            acc[v.status] = (acc[v.status] || 0) + 1;
            return acc;
        }, {});
        console.log("📈 By status:", counts);
    }

    // 3. Count with MMSI (ready to track)
    const { data: withMmsi, error: mmsiError } = await supabase
        .from('vessels')
        .select('imo, mmsi, name, status')
        .not('mmsi', 'is', null)
        .limit(10);

    if (!mmsiError && withMmsi) {
        console.log(`\n🚢 Vessels with MMSI (ready to track): ${withMmsi.length}+`);
        if (withMmsi.length > 0) {
            console.log("Sample:");
            withMmsi.slice(0, 5).forEach(v => {
                console.log(`  - ${v.name} (IMO: ${v.imo}, MMSI: ${v.mmsi}) [${v.status}]`);
            });
        }
    }

    // 4. Count without MMSI (pending discovery)
    const { count: pendingCount } = await supabase
        .from('vessels')
        .select('*', { count: 'exact', head: true })
        .is('mmsi', null)
        .eq('status', 'active');

    console.log(`\n⏳ Vessels pending MMSI discovery: ${pendingCount || 0}`);

    if ((total || 0) === 0) {
        console.log("\n⚠️  No vessels in table! Run: node scripts/import_vessels_from_csv.js");
    } else if ((pendingCount || 0) > 0) {
        console.log("\n✅ Vessels are waiting for MMSI discovery from AIS stream.");
        console.log("   Ships will appear on the map as they broadcast their ShipStaticData messages.");
    }
}

checkVessels().catch(console.error);
