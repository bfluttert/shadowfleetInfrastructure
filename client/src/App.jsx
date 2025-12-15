import React, { useState } from 'react'
import Map from './components/Map'
import SearchOverlay from './components/SearchOverlay'
import { ShipProvider, useShips } from './context/ShipContext'

function Dashboard() {
    const [selectedVessel, setSelectedVessel] = useState(null)
    const { shipsRef } = useShips()
    const [showShips, setShowShips] = useState(true)

    const handleSelectVessel = (csvVessel) => {
        // Validation: Check if the vessel is currently being tracked
        let found = null
        const qName = csvVessel.name.toLowerCase()

        if (shipsRef.current) {
            for (const [mmsi, ship] of shipsRef.current) {
                // Check fuzzy name match or verification
                // Note: ship.name comes from AIS or our enriched map
                if (ship.name && ship.name.toLowerCase() === qName) {
                    found = ship
                    break
                }
            }
        }

        if (found) {
            setSelectedVessel(found)
        } else {
            console.warn("Vessel not found in live stream:", csvVessel.name)
            alert(`Vessel "${csvVessel.name}" is not currently detected in the live stream.`)
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

function App() {
    return (
        <ShipProvider>
            <Dashboard />
        </ShipProvider>
    )
}

export default App
