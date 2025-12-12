import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const PRUNE_INTERVAL_MS = 60 * 1000 // Run cleanup every 1 min
const STALE_THRESHOLD_MS = 10 * 60 * 1000 // Remove if no update for 10 mins

export const useShipTracker = () => {
    // We use a Ref to store ships to avoid re-rendering the hook consumer 
    // on every single packet (which could be dozens per second).
    // The consumer (Canvas Layer) will read this ref in its animation loop.
    const shipsRef = useRef(new Map())

    useEffect(() => {
        const socket = io('http://localhost:3001')

        socket.on('connect', () => {
            console.log("Connected to Ship Proxy")
        })

        socket.on('ship-update', (ship) => {
            // Update the map
            shipsRef.current.set(ship.mmsi, {
                ...ship,
                ts: Date.now() // Timestamp for stale checking
            })
        })

        // Cleanup Interval
        const pruneTimer = setInterval(() => {
            const now = Date.now()
            let deleted = 0
            for (const [mmsi, data] of shipsRef.current) {
                if (now - data.ts > STALE_THRESHOLD_MS) {
                    shipsRef.current.delete(mmsi)
                    deleted++
                }
            }
            if (deleted > 0) console.log(`Pruned ${deleted} stale ghost ships`)
        }, PRUNE_INTERVAL_MS)

        return () => {
            socket.disconnect()
            clearInterval(pruneTimer)
        }
    }, [])

    return shipsRef
}
