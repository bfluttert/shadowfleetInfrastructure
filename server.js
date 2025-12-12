
import { WebSocket } from 'ws';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import fs from 'fs';
import Papa from 'papaparse';
import path from 'path';

dotenv.config();

const PORT = 3001;
const io = new Server(PORT, {
    cors: { origin: "*" }
});

const AIS_KEY = process.env.AIS_KEY;

if (!AIS_KEY) {
    console.error("Error: AIS_KEY not found in .env");
}

// --- WATCHLIST LOADING ---
const watchedIMOs = new Set();
const watchedNames = new Set();

const loadWatchlist = () => {
    try {
        const csvPath = 'ImportversionListOfEUDesignatedVessels231025.csv'; // Root dir
        if (fs.existsSync(csvPath)) {
            const fileContent = fs.readFileSync(csvPath, 'utf8');
            Papa.parse(fileContent, {
                header: true,
                delimiter: ';',
                complete: (results) => {
                    results.data.forEach(row => {
                        if (row['IMO number ']) watchedIMOs.add(String(row['IMO number ']).trim());
                        if (row['Vessel name']) watchedNames.add(row['Vessel name'].trim().toUpperCase());
                    });
                    console.log(`Loaded Watchlist: ${watchedIMOs.size} IMOs, ${watchedNames.size} Names.`);
                }
            });
        } else {
            console.error("Watchlist CSV not found!");
        }
    } catch (err) {
        console.error("Error loading watchlist:", err);
    }
};

loadWatchlist();

// Cache relevant MMSIs found in the stream that map to our watchlist
const verifiedShadowMMSIs = new Set();

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
            // Expanded to Europe (approx)
            BoundingBoxes: [[[29.0, -25.0], [72.0, 45.0]]],
            // We need Static Data to link MMSI -> IMO
            FilterMessageTypes: ["PositionReport", "ShipStaticData"]
        };
        socket.send(JSON.stringify(subscription));
    });

    socket.on('message', (data) => {
        try {
            const raw = data.toString();
            const safeData = JSON.parse(raw);
            const msgType = safeData.MessageType;

            // 1. Handle Static Data (Link MMSI <-> IMO)
            if (msgType === 'ShipStaticData') {
                const report = safeData.Message.ShipStaticData;
                const mmsi = safeData.MetaData.MMSI;
                const imo = report.ImoNumber;

                if (imo && watchedIMOs.has(String(imo))) {
                    if (!verifiedShadowMMSIs.has(mmsi)) {
                        console.log(`MATCH FOUND (IMO): ${report.Name} (${imo})`);
                        verifiedShadowMMSIs.add(mmsi);
                    }
                }
            }

            // 2. Handle Position Reports
            if (msgType === 'PositionReport') {
                const meta = safeData.MetaData;
                const mmsi = meta.MMSI;
                const name = meta.ShipName ? meta.ShipName.trim().toUpperCase() : '';

                // FILTER CHECK
                let isMatch = verifiedShadowMMSIs.has(mmsi);

                // Name matching removed for strict IMO enforcement
                // if (!isMatch && name && watchedNames.has(name)) { ... }

                if (isMatch) {
                    const report = safeData.Message.PositionReport;
                    const ship = {
                        mmsi: mmsi,
                        lat: report.Latitude,
                        lon: report.Longitude,
                        cog: report.Cog,
                        name: meta.ShipName || 'Verified Shadow Vessel'
                    };
                    io.emit('ship-update', ship);
                }
            }

        } catch (err) {
            console.error("Parse error:", err.message);
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

