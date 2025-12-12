import React, { useEffect, useState } from 'react'
import { GeoJSON, LayersControl, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import { supabase } from '../lib/supabase'

// Dynamic icon generator
const getIcon = (type) => {
    let emoji = '📍'
    let color = '#3388ff'

    switch (type) {
        case 'port': emoji = '⚓'; color = '#0077be'; break;
        case 'nuclear_plant': emoji = '☢️'; color = '#ffcc00'; break;
        case 'wind_farm': emoji = '🍃'; color = '#77dd77'; break;
        case 'platform': emoji = '🛢️'; color = '#555'; break;
        default: emoji = '📍';
    }

    return L.divIcon({
        html: `<div class="map-icon-marker" style="background:${color}; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 0 4px black; font-size:14px;">${emoji}</div>`,
        className: 'custom-div-icon', // Important for CSS selection
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    })
}

const InfrastructureLayer = ({ visibility }) => {
    const [powerCables, setPowerCables] = useState(null)
    const [telecomCables, setTelecomCables] = useState(null)
    const [pipelines, setPipelines] = useState(null)
    const [windFarms, setWindFarms] = useState(null)
    const [nuclear, setNuclear] = useState(null)
    const [ports, setPorts] = useState(null)
    const [military, setMilitary] = useState(null)
    const [platforms, setPlatforms] = useState(null)

    // Zoom LOD State
    const [zoom, setZoom] = useState(5)

    useMapEvents({
        zoomend: (e) => {
            setZoom(e.target.getZoom())
        }
    })

    useEffect(() => {
        if (!supabase) return

        // TOGGLE THIS TO TRUE TO RELOAD DATA
        const ENABLE_FETCH = true

        if (!ENABLE_FETCH) {
            console.log("Data fetching disabled for UI development.")
            return
        }

        const fetchData = async () => {
            // Helper to fetch using pagination to bypass 1000 row limit
            const fetchLayer = async (type, setter, label, limit = null) => {
                let allData = []
                let from = 0
                const size = 500 // Reduced from 1000 to prevent 500 errors on heavy geometries
                let more = true

                while (more) {
                    const query = supabase
                        .from('infrastructure_layers')
                        .select('*, geom_geojson')
                        .eq('type', type)
                        .range(from, from + size - 1)

                    if (limit && limit < size) {
                        query.range(0, limit - 1)
                        more = false
                    }

                    const { data, error } = await query
                    if (error) {
                        console.error("Error fetching layer:", type, error)
                        break
                    }

                    if (data) {
                        allData = [...allData, ...data]
                        if (data.length < size) {
                            more = false
                        } else {
                            from += size
                        }
                    } else {
                        more = false
                    }

                    if (allData.length > 50000) more = false
                }

                if (allData.length > 0) {
                    console.log(`Loaded ${label}: ${allData.length} features`)
                    setter({
                        type: "FeatureCollection",
                        features: allData.map(d => {
                            const attr = d.attributes || {}

                            let content = ''
                            const row = (Label, Value) => `<div><b>${Label}:</b> ${Value || 'N/A'}</div>`

                            switch (d.type) {
                                case 'gas_pipeline':
                                    content = [
                                        row('Name', d.name),
                                        row('ID', d.id),
                                        row('Status', d.status),
                                        row('Medium', d.medium),
                                        row('Country', d.country)
                                    ].join('')
                                    break;
                                case 'platform':
                                    content = [
                                        row('Name', d.name),
                                        row('Function', attr.FUNCTION),
                                        row('Operator', attr.OPERATOR),
                                        row('Primary Prod', attr.PRIM_PROD),
                                        row('Status', d.status),
                                        row('Country', d.country)
                                    ].join('')
                                    break;
                                case 'nuclear_plant':
                                    content = [
                                        row('Name', d.name),
                                        row('Reactors', attr.Reactors_N),
                                        row('Thermal Cap', attr.The_Cap_MW),
                                        row('Net Cap', attr.Net_Cap_MW),
                                        row('Status', d.status),
                                        row('Country', attr.Country || d.country)
                                    ].join('')
                                    break;
                                case 'military_area':
                                    content = [
                                        row('Name', d.name),
                                        row('Type', attr.TYPE_1), // Fixed Attribute
                                        row('Status', d.status),
                                        row('Country', d.country)
                                    ].join('')
                                    break;
                                case 'port':
                                    content = [
                                        row('Port Name', attr.PORT_NAME || d.name),
                                        row('Port ID', attr.PORT_ID),
                                        row('Country Code', attr.CNTR_CODE)
                                    ].join('')
                                    break;
                                case 'wind_farm':
                                    content = [
                                        row('Name', d.name),
                                        row('Turbines', attr.N_TURBINES),
                                        row('Power (MW)', attr.POWER_MW),
                                        row('Status', d.status),
                                        row('Country', d.country)
                                    ].join('')
                                    break;
                                default:
                                    content = row('Name', d.name)
                            }

                            const finalHtml = `<div style="font-family:sans-serif; font-size:12px; min-width:150px;">${content}</div>`

                            return {
                                type: "Feature",
                                properties: { ...d, popupContent: finalHtml },
                                geometry: d.geom_geojson
                            }
                        })
                    })
                }
            }

            // Fetch separate cable types
            await fetchLayer('power_cable', setPowerCables, 'Power Cable')
            await fetchLayer('telecom_cable', setTelecomCables, 'Telecom Cable')
            await fetchLayer('gas_pipeline', setPipelines, 'Pipeline')

            await fetchLayer('wind_farm', setWindFarms, 'Wind Farm')
            await fetchLayer('nuclear_plant', setNuclear, 'Nuclear Plant')
            await fetchLayer('port', setPorts, 'Port')
            await fetchLayer('military_area', setMilitary, 'Military Area')
            await fetchLayer('platform', setPlatforms, 'Offshore Platform')
        }

        fetchData()
    }, [])

    const powerCableStyle = { color: "#FF00FF", weight: 3, opacity: 1 } // Magenta DEBUG style
    const telecomCableStyle = { color: "#1E90FF", weight: 2, opacity: 0.8 }
    const pipelineStyle = { color: "#FF8C00", weight: 2.5, opacity: 0.8 }
    const windStyle = { color: "#00FF7F", weight: 1, fillOpacity: 0.3 }
    const militaryStyle = { color: "#FF4136", weight: 1, fillOpacity: 0.2, dashArray: '5, 5' }

    // LOD Logic
    const SHOW_CABLES = zoom > 6
    const SHOW_PIPELINES = zoom > 6
    const SHOW_WIND_POLY = zoom > 7

    return (
        <>
            {/* --- LINEAR FEATURES (Cables, Pipelines) --- */}
            {visibility.power_cable && powerCables && SHOW_CABLES && (
                <GeoJSON key={`power-${powerCables.features.length}`} data={powerCables} style={powerCableStyle} onEachFeature={(feature, layer) => layer.bindPopup(feature.properties.popupContent)} />
            )}
            {visibility.telecom_cable && telecomCables && SHOW_CABLES && (
                <GeoJSON data={telecomCables} style={telecomCableStyle} onEachFeature={(feature, layer) => layer.bindPopup(feature.properties.popupContent)} />
            )}
            {visibility.gas_pipeline && pipelines && SHOW_PIPELINES && (
                <GeoJSON data={pipelines} style={pipelineStyle} onEachFeature={(feature, layer) => layer.bindPopup(feature.properties.popupContent)} />
            )}

            {/* --- POLYGONS (Wind, Military) --- */}
            {visibility.wind_farm && windFarms && SHOW_WIND_POLY && (
                <GeoJSON
                    data={windFarms}
                    style={windStyle}
                    // Point to layer is handled by Cluster Group if point, but this layer likely has polygons too?
                    // Assuming mix. For now just standard GeoJSON for Polygons.
                    // If wind farms are polygons, they won't cluster well. 
                    // Let's assume Points.
                    pointToLayer={(feature, latlng) => L.marker(latlng, { icon: getIcon('wind_farm') })}
                    onEachFeature={(feature, layer) => layer.bindPopup(feature.properties.popupContent)}
                />
            )}
            {visibility.military_area && military && (
                <GeoJSON
                    data={military}
                    style={militaryStyle}
                    onEachFeature={(feature, layer) => layer.bindPopup(feature.properties.popupContent)}
                />
            )}

            {/* --- CLUSTERED POINT FEATURES --- */}
            <MarkerClusterGroup
                chunkedLoading
                iconCreateFunction={(cluster) => {
                    return L.divIcon({
                        html: `<div class="custom-cluster-icon"><span>${cluster.getChildCount()}</span></div>`,
                        className: 'custom-cluster-icon-marker',
                        iconSize: L.point(30, 30, true),
                    })
                }}
            >
                {visibility.nuclear_plant && nuclear && (
                    <GeoJSON
                        data={nuclear}
                        pointToLayer={(feature, latlng) => L.marker(latlng, { icon: getIcon('nuclear_plant') })}
                        onEachFeature={(feature, layer) => layer.bindPopup(feature.properties.popupContent)}
                    />
                )}
                {visibility.port && ports && (
                    <GeoJSON
                        data={ports}
                        pointToLayer={(feature, latlng) => L.marker(latlng, { icon: getIcon('port') })}
                        onEachFeature={(feature, layer) => layer.bindPopup(feature.properties.popupContent)}
                    />
                )}
                {visibility.platform && platforms && (
                    <GeoJSON
                        data={platforms}
                        pointToLayer={(feature, latlng) => L.marker(latlng, { icon: getIcon('platform') })}
                        onEachFeature={(feature, layer) => layer.bindPopup(feature.properties.popupContent)}
                    />
                )}
                {/* 
                   Wind Farms often have MANY points (turbines). 
                   If the wind_farm layer is Points (Turbines), it MUST be here. 
                   If it is Polygons (Areas), it stays above.
                   Most 'wind_farm' data is polygons, but some is turbines. 
                   Let's assume mixed or polygon for now and leave it unclustered to avoid polygon collapse errors.
                   Actually, user said "major wind farms" for low zoom.
                */}
            </MarkerClusterGroup>
        </>
    )
}

export default InfrastructureLayer
