import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import InfrastructureLayer from './InfrastructureLayer'
import ShipLayer from './ShipLayer'
import LayerManager from './LayerManager'

const MapController = ({ selectedVessel }) => {
    const map = useMap()
    useEffect(() => {
        if (selectedVessel && selectedVessel.lat && selectedVessel.lon) {
            map.flyTo([selectedVessel.lat, selectedVessel.lon], 10)
        }
    }, [selectedVessel, map])
    return null
}

const Map = ({ shipsRef, showShips, selectedVessel, onSelectShip }) => {
    // Layer Visibility State
    const [visibility, setVisibility] = useState({
        power_cable: true,
        telecom_cable: false,
        gas_pipeline: true,
        wind_farm: true,
        nuclear_plant: true,
        port: true,
        platform: true,
        military_area: true
    })

    const toggleLayer = (key) => {
        setVisibility(prev => ({ ...prev, [key]: !prev[key] }))
    }

    return (
        <>
            <LayerManager visibility={visibility} onToggle={toggleLayer} />

            <MapContainer
                center={[55, 15]}
                zoom={5}
                style={{ height: '100%', width: '100%', background: '#0e1117' }}
                zoomControl={false} // Disable default top-left
            >
                <ZoomControl position="bottomleft" /> {/* Move to bottom-left */}

                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                <InfrastructureLayer visibility={visibility} />

                {/* Real-time Ship Layer (Canvas) */}
                {showShips && <ShipLayer shipsRef={shipsRef} onSelect={onSelectShip} />}

                <MapController selectedVessel={selectedVessel} />
            </MapContainer>
        </>
    )
}

export default Map
