import React from 'react'
import { Marker, Popup, LayerGroup } from 'react-leaflet'
import L from 'leaflet'
import { parse } from 'wellknown'

// Custom Triangle Icon (Reused)
const createVesselIcon = (heading, isShadowFleet) => {
    const color = isShadowFleet ? '#FF4136' : '#2ECC40' // Red or Green
    const svg = `
    <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(${heading}deg);">
        <path d="M10 0 L20 20 L10 15 L0 20 Z" fill="${color}" stroke="white" stroke-width="1"/>
    </svg>
    `
    return L.divIcon({
        html: svg,
        className: 'vessel-icon',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    })
}

const VesselLayer = ({ vessels }) => {
    if (!vessels) return null

    // Expecting vessels as array or object values
    const vesselList = Array.isArray(vessels) ? vessels : Object.values(vessels)

    return (
        <LayerGroup>
            {vesselList.map(v => (
                v.lat && v.lon ? (
                    <Marker
                        key={v.id || v.mmsi}
                        position={[v.lat, v.lon]}
                        icon={createVesselIcon(v.heading || 0, true)}
                    >
                        <Popup>
                            <strong>{v.vessel_name || v.mmsi}</strong><br />
                            <strong>MMSI:</strong> {v.mmsi}<br />
                            <strong>IMO:</strong> {v.imo}<br />
                            <strong>Speed:</strong> {v.speed_knots} kn <br />
                            <strong>Status:</strong> {v.nav_status}
                        </Popup>
                    </Marker>
                ) : null
            ))}
        </LayerGroup>
    )
}

export default VesselLayer
