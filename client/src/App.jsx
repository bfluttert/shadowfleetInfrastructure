import React, { useState } from 'react'
import Map from './components/Map'
import SearchOverlay from './components/SearchOverlay'
import Legend from './components/Legend'
import { ShipProvider, useShips } from './context/ShipContext'

function Dashboard() {
    const [selectedVessel, setSelectedVessel] = useState(null)
    const { shipsRef } = useShips()
    const [showShips, setShowShips] = useState(true)

    const handleSelectVessel = (vessel) => {
        // If the 'vessel' already has lat/lon (passed from map click), just set it.
        // If it's from the search (CSV), find it in live data.
        if (vessel.lat && vessel.lon) {
            setSelectedVessel(vessel)
            return
        }

        let found = null
        const qName = vessel.name.toLowerCase()

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
            console.warn("Vessel not found in live stream:", vessel.name)
            alert(`Vessel "${vessel.name}" is not currently detected in the live stream.`)
        }
    }

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#1a1a1a' }}>
            <SearchOverlay
                onSelect={handleSelectVessel}
                onToggleAll={setShowShips}
                selectedVessel={selectedVessel}
                onClearSelection={() => setSelectedVessel(null)}
            />
            <Map
                shipsRef={shipsRef}
                showShips={showShips}
                selectedVessel={selectedVessel}
                onSelectShip={handleSelectVessel}
            />
            <Legend />
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
