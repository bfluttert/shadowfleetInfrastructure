import React, { useState, useEffect, useMemo } from 'react'
import Papa from 'papaparse'

const SearchOverlay = ({ onSelect, onToggleAll, selectedVessel }) => {
    const [query, setQuery] = useState('')
    const [suggestions, setSuggestions] = useState([]) // From CSV
    const [allVessels, setAllVessels] = useState([]) // Loaded CSV data
    const [showSuggestions, setShowSuggestions] = useState(false)

    // Load CSV on mount
    useEffect(() => {
        fetch('/vessels.csv')
            .then(r => r.text())
            .then(csvText => {
                Papa.parse(csvText, {
                    header: true,
                    delimiter: ";", // The user's CSV uses semicolons
                    complete: (results) => {
                        // Map to simple structure
                        // Columns: "Vessel name", "IMO number "
                        const data = results.data
                            .filter(row => row['Vessel name'] && row['IMO number '])
                            .map(row => ({
                                name: row['Vessel name'],
                                imo: row['IMO number '],
                                date: row['Date of applicat']
                            }))
                        setAllVessels(data)
                        // console.log("Loaded watchlist:", data.length)
                    }
                })
            })
            .catch(err => console.error("Failed to load vessel list:", err))
    }, [])

    // Filter Logic for Suggestions
    useEffect(() => {
        if (!query) {
            setSuggestions([])
            return
        }
        const q = query.toLowerCase()
        const matches = allVessels.filter(v =>
            (v.name && v.name.toLowerCase().includes(q)) ||
            (v.imo && String(v.imo).includes(q))
        ).slice(0, 10) // Limit to 10
        setSuggestions(matches)
    }, [query, allVessels])

    return (
        <div className="glass-panel" style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 1000,
            width: '400px', // Increased width
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        }}>
            {/* Top Bar: Hamburger | Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button style={{
                    background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer'
                }}>
                    ☰
                </button>

                <div style={{ position: 'relative', flex: 1 }}>
                    <input
                        type="text"
                        placeholder="Search Name or IMO..."
                        value={query}
                        onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
                        onFocus={() => setShowSuggestions(true)}
                        style={{
                            width: '93%',
                            background: 'rgba(0,0,0,0.2)',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '10px 12px',
                            color: 'white',
                            outline: 'none',
                            fontSize: '14px'
                        }}
                    />
                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="glass-panel" style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '4px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            background: 'rgba(20, 20, 20, 0.95)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            {suggestions.map((v, i) => (
                                <div
                                    key={i}
                                    onClick={() => {
                                        setQuery(v.name)
                                        setShowSuggestions(false)
                                        onSelect(v) // Pass the CSV vessel data (IMO/Name)
                                    }}
                                    style={{
                                        padding: '8px 12px',
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        cursor: 'pointer',
                                        fontSize: '13px'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ fontWeight: 500 }}>{v.name}</div>
                                    <div style={{ fontSize: '11px', color: '#888' }}>IMO: {v.imo}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Select/Deselect All Buttons */}
            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                <button
                    onClick={() => onToggleAll(true)}
                    style={{
                        flex: 1,
                        padding: '8px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '6px',
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                >
                    Show All
                </button>
                <button
                    onClick={() => onToggleAll(false)}
                    style={{
                        flex: 1,
                        padding: '8px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '6px',
                        color: 'rgba(255,255,255,0.8)',
                        fontSize: '11px',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                >
                    Hide All
                </button>
            </div>

            {/* Ship Details Card (Appears when selected) */}
            {selectedVessel && (
                <div style={{
                    marginTop: '8px',
                    padding: '12px',
                    background: 'rgba(0, 255, 255, 0.05)',
                    border: '1px solid rgba(0, 255, 255, 0.2)',
                    borderRadius: '8px',
                    animation: 'fadeIn 0.3s'
                }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#00FFFF', marginBottom: '4px' }}>
                        {selectedVessel.name || 'Unknown Vessel'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#ccc', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                        <div>IMO: <span style={{ color: 'white' }}>{selectedVessel.imo || 'N/A'}</span></div>
                        <div>MMSI: <span style={{ color: 'white' }}>{selectedVessel.mmsi || 'N/A'}</span></div>
                        <div>COG: <span style={{ color: 'white' }}>{selectedVessel.cog ? Math.round(selectedVessel.cog) + '°' : '-'}</span></div>
                        <div>Lat: <span style={{ color: 'white' }}>{selectedVessel.lat ? selectedVessel.lat.toFixed(4) : '-'}</span></div>
                        <div>Lon: <span style={{ color: 'white' }}>{selectedVessel.lon ? selectedVessel.lon.toFixed(4) : '-'}</span></div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SearchOverlay
