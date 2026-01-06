import React, { useState, useEffect, useMemo } from 'react'
import Papa from 'papaparse'

const SearchOverlay = ({ onSelect, onToggleAll, selectedVessel, onClearSelection }) => {
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
            gap: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px'
        }}>
            {/* Top Bar: Hamburger | Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button style={{
                    background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer', opacity: 0.7
                }}>
                    ☰
                </button>

                <div style={{ position: 'relative', flex: 1 }}>
                    <input
                        type="text"
                        placeholder="Search Vessel Name, MMSI, or IMO..."
                        value={query}
                        onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
                        onFocus={(e) => {
                            setShowSuggestions(true);
                            e.target.style.borderColor = 'rgba(0, 255, 255, 0.4)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                        }}
                    />
                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="glass-panel" style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '8px',
                            maxHeight: '240px',
                            overflowY: 'auto',
                            background: 'rgba(15, 15, 15, 0.98)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                            zIndex: 1100
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
                                        padding: '10px 16px',
                                        borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 255, 255, 0.1)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ fontWeight: 600, color: '#fff' }}>{v.name}</div>
                                    <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>IMO: {v.imo}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Select/Deselect All Buttons */}
            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                <button
                    onClick={() => onToggleAll(true)}
                    className="vessel-btn"
                    style={{
                        flex: 1,
                        padding: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        color: '#eee',
                        fontSize: '11px',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    }}
                >
                    Show Fleet
                </button>
                <button
                    onClick={() => onToggleAll(false)}
                    style={{
                        flex: 1,
                        padding: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        color: '#eee',
                        fontSize: '11px',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    }}
                >
                    Hide Fleet
                </button>
            </div>

            {/* Ship Details Card (Appears when selected) */}
            {selectedVessel && (
                <div style={{
                    position: 'relative',
                    marginTop: '4px',
                    padding: '16px',
                    background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(0, 100, 255, 0.05) 100%)',
                    border: '1px solid rgba(0, 255, 255, 0.3)',
                    borderRadius: '10px',
                    boxShadow: 'inset 0 0 20px rgba(0, 255, 255, 0.05), 0 4px 12px rgba(0,0,0,0.2)',
                    animation: 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    overflow: 'hidden'
                }}>
                    {/* Header with Close Button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                            <div style={{ fontSize: '11px', color: 'rgba(0, 255, 255, 0.7)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, marginBottom: '2px' }}>
                                Vessel Profile
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', textShadow: '0 0 10px rgba(0,255,255,0.3)' }}>
                                {selectedVessel.name || 'Unknown Vessel'}
                            </div>
                        </div>
                        <button
                            onClick={onClearSelection}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                                e.currentTarget.style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '12px',
                        background: 'rgba(0,0,0,0.2)',
                        padding: '12px',
                        borderRadius: '6px'
                    }}>
                        <InfoItem label="IMO NUMBER" value={selectedVessel.imo || '---'} />
                        <InfoItem label="MMSI ID" value={selectedVessel.mmsi || '---'} />
                        <InfoItem label="COURSE (COG)" value={selectedVessel.cog ? `${Math.round(selectedVessel.cog)}°` : '---'} />
                        <InfoItem label="SPEED (SOG)" value={selectedVessel.speed ? `${selectedVessel.speed.toFixed(1)} kn` : '---'} />
                        <InfoItem label="LATITUDE" value={selectedVessel.lat ? selectedVessel.lat.toFixed(5) : '---'} mono />
                        <InfoItem label="LONGITUDE" value={selectedVessel.lon ? selectedVessel.lon.toFixed(5) : '---'} mono />
                    </div>

                    {/* Decorative bottom element */}
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        height: '2px',
                        background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.5), transparent)'
                    }} />
                </div>
            )}
        </div>
    )
}

// Helper component for layout
const InfoItem = ({ label, value, mono }) => (
    <div>
        <div style={{ fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{label}</div>
        <div style={{
            fontSize: '13px',
            color: '#eee',
            fontWeight: 500,
            fontFamily: mono ? 'monospace' : 'inherit'
        }}>{value}</div>
    </div>
)

export default SearchOverlay
