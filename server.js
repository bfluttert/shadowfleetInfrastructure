import { WebSocket } from 'ws';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const PORT = 3001;
const io = new Server(PORT, {
    cors: { origin: "*" }
});

const AIS_KEY = process.env.AIS_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!AIS_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Error: Missing keys in .env (AIS_KEY, SUPABASE_URL, SUPABASE_KEY)");
    process.exit(1);
}

// --- SUPABASE CLIENT ---
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- STATE MANAGEMENT ---
// Map<MMSI, IMO> - Source of Truth cache for vessels with known MMSI
const vesselMap = new Map();
// Set<IMO> - Vessels we're looking for (MMSI unknown)
const pendingIMOs = new Set();

// Helper to format data for frontend
const formatData = (data) => {
    const report = data.Message.PositionReport;
    const meta = data.MetaData;
    return {
        mmsi: meta.MMSI,
        imo: vesselMap.get(meta.MMSI), // Enrich with our known IMO
        lat: report.Latitude,
        lon: report.Longitude,
        cog: report.Cog,
        sog: report.Sog,
        hdg: report.TrueHeading,
        name: meta.ShipName ? meta.ShipName.trim() : 'Unknown',
        ts: Date.now()
    };
};

// --- SYNC FUNCTION ---
async function syncVessels() {
    console.log("Syncing vessels from Supabase...");
    const { data, error } = await supabase
        .from('vessels')
        .select('imo, mmsi, name')
        .eq('status', 'active');

    if (error) {
        console.error("Error syncing vessels:", error);
        return;
    }

    // Clear and rebuild maps
    const newMap = new Map();
    const newPending = new Set();

    data.forEach(v => {
        if (v.mmsi && v.imo) {
            // We know both IMO and MMSI - ready to track
            newMap.set(Number(v.mmsi), Number(v.imo));
        } else if (v.imo && !v.mmsi) {
            // We only know IMO - need to discover MMSI
            newPending.add(Number(v.imo));
        }
    });

    // Update global maps
    vesselMap.clear();
    pendingIMOs.clear();
    newMap.forEach((imo, mmsi) => vesselMap.set(mmsi, imo));
    newPending.forEach(imo => pendingIMOs.add(imo));

    console.log(`Synced: ${vesselMap.size} vessels with MMSI, ${pendingIMOs.size} pending discovery.`);
}

// Initial Sync + Periodic Refresh (10 mins)
syncVessels();
setInterval(syncVessels, 10 * 60 * 1000);


// --- AIS STREAM CONNECTION ---
let socket = null;
let reconnectTimer = null;

function connectToAis() {
    if (socket) {
        try { socket.terminate(); } catch (e) { }
    }

    console.log("Connecting to AISStream...");
    socket = new WebSocket('wss://stream.aisstream.io/v0/stream');

    socket.on('open', () => {
        console.log("Connected to AIS Stream");
        const subscription = {
            APIKey: AIS_KEY,
            BoundingBoxes: [[[29.0, -25.0], [72.0, 45.0]]],
            FilterMessageTypes: ["PositionReport", "ShipStaticData"]
        };
        socket.send(JSON.stringify(subscription));
    });

    socket.on('message', (data) => {
        try {
            const raw = data.toString();
            const safeData = JSON.parse(raw);
            const msgType = safeData.MessageType;
            const mmsi = safeData.MetaData.MMSI;

            // 1. TRUST: Position Report
            if (msgType === 'PositionReport') {
                // Only emit if we already know this MMSI
                if (vesselMap.has(mmsi)) {
                    io.emit('ship-update', formatData(safeData));
                }
            }

            // 2. VERIFY & DISCOVER: Static Data
            if (msgType === 'ShipStaticData') {
                const reportedImo = safeData.Message.ShipStaticData.ImoNumber;

                if (!reportedImo) return; // No IMO in this message

                // Case A: Auto-Discovery - We're looking for this IMO!
                if (pendingIMOs.has(reportedImo)) {
                    console.log(`🎯 DISCOVERED: IMO ${reportedImo} → MMSI ${mmsi}`);

                    // Update database
                    supabase.from('vessels')
                        .update({
                            mmsi: mmsi,
                            last_verified: new Date().toISOString()
                        })
                        .eq('imo', reportedImo)
                        .then(({ error }) => {
                            if (error) {
                                console.error("Failed to update MMSI in DB", error);
                            } else {
                                // Success! Move from pending to active tracking
                                pendingIMOs.delete(reportedImo);
                                vesselMap.set(mmsi, reportedImo);
                                console.log(`✅ Now tracking MMSI ${mmsi} (IMO ${reportedImo})`);
                            }
                        });
                }
                // Case B: Verification - We already track this MMSI
                else if (vesselMap.has(mmsi)) {
                    const storedImo = vesselMap.get(mmsi);

                    // Validate
                    if (reportedImo !== storedImo) {
                        console.log(`⚠️ CRITICAL: Mismatch! MMSI ${mmsi} broadcasting IMO ${reportedImo}, expected ${storedImo}`);

                        // Flag in DB
                        supabase.from('vessels')
                            .update({
                                status: 'mismatch',
                                last_verified: new Date().toISOString()
                            })
                            .eq('imo', storedImo)
                            .then(({ error }) => {
                                if (error) console.error("Failed to flag mismatch in DB", error);
                            });

                        // Stop tracking immediately
                        vesselMap.delete(mmsi);
                    }
                }
            }

        } catch (err) {
            // Silently ignore parse errors to avoid spam
        }
    });

    socket.on('error', (err) => {
        console.error("AIS WebSocket Error:", err.message);
    });

    socket.on('close', () => {
        console.log("Stream closed. Reconnecting in 5s...");
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connectToAis, 5000);
    });
}

connectToAis();
console.log(`Ship Proxy Server running on port ${PORT}`);
