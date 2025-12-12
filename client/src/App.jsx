import React, { useEffect, useState } from 'react'
import Map from './components/Map'
import SearchOverlay from './components/SearchOverlay'
import { supabase } from './lib/supabase'
import { useShipTracker } from './hooks/useShipTracker'

function App() {
    const [selectedVessel, setSelectedVessel] = useState(null)
    const shipsRef = useShipTracker()
    const [showShips, setShowShips] = useState(true)

    const handleSelectVessel = (csvVessel) => {
        // Logic to find this vessel in the live AIS map?
        // Since AIS uses MMSI and CSV uses IMO, we need a way to link them.
        // For now, we just pass the selected info to the map.
        // If the map knows the lat/lon of this result, it flies there.
        // But the CSV doesn't have Lat/Lon. 
        // We would need to search the shipsRef for a matching Name or IMO (if available in AIS metadata).

        // Attempt to find in live data
        let found = null
        const qName = csvVessel.name.toLowerCase()
        // Iterate shipsRef (it's a Map)
        if (shipsRef.current) {
            for (const [mmsi, ship] of shipsRef.current) {
                if (ship.name && ship.name.toLowerCase() === qName) {
                    found = ship
                    break
                }
            }
        }

        if (found) {
            setSelectedVessel(found)
        } else {
            console.warn("Vessel from watchlist not currently visible in AIS stream:", csvVessel.name)
            alert(`Vessel "${csvVessel.name}" is in the watchlist but not currently detected in the North Sea live stream.`)
        }
    }

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#1a1a1a' }}>
            <SearchOverlay
                onSelect={handleSelectVessel}
                onToggleAll={setShowShips}
            />
            <Map
                shipsRef={shipsRef}
                showShips={showShips}
                selectedVessel={selectedVessel}
                onSelectShip={handleSelectVessel}
            />
        </div>
    )
}

export default App
