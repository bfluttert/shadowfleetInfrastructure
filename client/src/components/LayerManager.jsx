import React, { useState } from 'react'

const LayerManager = ({ visibility, onToggle }) => {
    const [isOpen, setIsOpen] = useState(false)

    const groups = {
        'Energy': ['power_cable', 'wind_farm', 'nuclear_plant', 'platform'],
        'Transport': ['gas_pipeline', 'port'],
        'Telecom': ['telecom_cable'],
        'Restricted': ['military_area'],
        'Maritime': ['eez']
    }

    const labels = {
        'power_cable': 'Power Cables',
        'wind_farm': 'Wind Farms',
        'nuclear_plant': 'Nuclear Plants',
        'platform': 'Offshore Platforms',
        'gas_pipeline': 'Gas/Oil Pipelines',
        'port': 'Ports',
        'telecom_cable': 'Telecom Cables',
        'military_area': 'Military Areas',
        'eez': 'Exclusive Econ. Zones'
    }

    return (
        <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            {/* FAB */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="glass-panel"
                style={{
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    marginBottom: '10px',
                    border: isOpen ? '1px solid var(--accent-color)' : '1px solid var(--glass-border)'
                }}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
            </button>

            {/* Drawer */}
            {isOpen && (
                <div className="glass-panel" style={{ padding: '16px', minWidth: '220px' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Layers</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {Object.entries(groups).map(([groupName, keys]) => (
                            <div key={groupName}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--accent-color)' }}>{groupName}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {keys.map(key => (
                                        <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '13px' }}>{labels[key]}</span>

                                            {/* iOS Toggle Switch */}
                                            <div
                                                onClick={() => onToggle(key)}
                                                style={{
                                                    width: '36px',
                                                    height: '20px',
                                                    background: visibility[key] ? 'var(--accent-color)' : '#444',
                                                    borderRadius: '10px',
                                                    position: 'relative',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.3s'
                                                }}
                                            >
                                                <div style={{
                                                    width: '16px',
                                                    height: '16px',
                                                    background: 'white',
                                                    borderRadius: '50%',
                                                    position: 'absolute',
                                                    top: '2px',
                                                    left: visibility[key] ? '18px' : '2px',
                                                    transition: 'left 0.3s'
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default LayerManager
