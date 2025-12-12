import { createClient } from '@supabase/supabase-js'
import WebSocket from 'ws'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const aisKey = process.env.AISSTREAM_API_KEY

if (!supabaseUrl || !supabaseKey || !aisKey) {
    console.error('Error: Required env vars missing (SUPABASE_URL, SUPABASE_SERVICE_KEY, AISSTREAM_API_KEY).')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// State
const watchlistImos = new Set() // Set<number>
const trackedMmsi = new Map()   // Map<mmsi, imo>

async function loadWatchlist() {
    console.log('Loading watchlist...')
    const { data, error } = await supabase.from('watch_list').select('imo')
    if (error) {
        console.error('Error loading watchlist:', error)
        return
    }

    data.forEach(row => {
        if (row.imo) watchlistImos.add(row.imo)
    })
    console.log(`Loaded ${watchlistImos.size} vessels to watch.`)
}

function connect() {
    const socket = new WebSocket('wss://stream.aisstream.io/v0/stream')

    socket.on('open', () => {
        console.log('Connected to AIS Stream!')
        const subscriptionMessage = {
            APIKey: aisKey,
            BoundingBoxes: [
                [
                    [30.0, -15.0], // South-West (Lat, Lon)
                    [72.0, 45.0]   // North-East (Lat, Lon) - Covers Europe/Med
                ]
            ],
            FiltersShipMMSI: null, // Receive all, filter locally? Or can we filter by IMO? API doesn't support FilterShipIMO directly in some tiers, checking docs...
            // Actually AISStream supports FilterShipMMSI. But we have IMOs. We need to map them.
            // So we must subscribe to all traffic in the box and filter client-side.
            FilterMessageTypes: ["PositionReport", "ShipStaticData"]
        }
        socket.send(JSON.stringify(subscriptionMessage))
    })

    socket.on('message', async (data) => {
        try {
            const message = JSON.parse(data.toString())
            const { MessageType, MetaData } = message

            if (MessageType === 'ShipStaticData') {
                const report = message.Message.ShipStaticData
                const mmsi = report.UserID // MMSI
                const imo = report.ImoNumber

                if (imo && watchlistImos.has(imo)) {
                    if (!trackedMmsi.has(mmsi)) {
                        console.log(`🎯 FOUND WATCHLIST VESSEL! Name: ${report.Name}, IMO: ${imo}, MMSI: ${mmsi}`)
                        trackedMmsi.set(mmsi, imo)
                    }
                }
            } else if (MessageType === 'PositionReport') {
                const report = message.Message.PositionReport
                const mmsi = report.UserID

                // Only process if we know this MMSI belongs to a watchlist IMO
                if (trackedMmsi.has(mmsi)) {
                    const imo = trackedMmsi.get(mmsi)
                    processPosition(mmsi, imo, report, MetaData)
                }
            } else {
                // Handle other types if needed, or unmapped PositionReports
                // Maybe we want to log if we see a watchlist IMO even if it's not in our MMSI map yet?
                // But PositionReport doesn't have IMO. So we rely on StationData to map it first.
            }

        } catch (err) {
            console.error('Error parsing message:', err)
        }
    })

    socket.on('close', () => {
        console.log('Socket closed. Reconnecting in 5s...')
        setTimeout(connect, 5000)
    })

    socket.on('error', (err) => {
        console.error('Socket error:', err)
    })
}

async function processPosition(mmsi, imo, report, meta) {
    // Insert into Supabase
    // console.log(`Updates for IMO ${imo} (MMSI ${mmsi})`)

    const { error } = await supabase.from('ais_positions').insert({
        mmsi: mmsi,
        imo: imo,
        timestamp: meta.time_utc, // or new Date().toISOString()
        geom: `POINT(${report.Longitude} ${report.Latitude})`, // WKT for PostGIS
        speed_knots: report.Sog,
        heading: report.TrueHeading,
        nav_status: report.NavigationalStatus?.toString() || 'unknown'
    })

    if (error) console.error('Error insert position:', error)
    else process.stdout.write('+')
}

// Start
loadWatchlist().then(connect)
