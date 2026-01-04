import React, { useState } from 'react'

const Legend = () => {
    const [isOpen, setIsOpen] = useState(false)

    const sections = [
        {
            title: 'Vessels',
            items: [{ label: 'Live Ships', color: '#00FFFF', icon: 'triangle-neon' }]
        },
        {
            title: 'Energy',
            items: [
                { label: 'Cables', color: '#FF00FF', type: 'line' },
                { label: 'Wind Farms', color: '#77dd77', emoji: '🍃' },
                { label: 'Nuclear', color: '#ffcc00', emoji: '☢️' },
                { label: 'Platforms', color: '#555', emoji: '🛢️' },
            ]
        },
        {
            title: 'Transport',
            items: [
                { label: 'Pipelines', color: '#FF8C00', type: 'line' },
                { label: 'Ports', color: '#0077be', emoji: '⚓' },
            ]
        },
        {
            title: 'Telecom',
            items: [{ label: 'Cables', color: '#1E90FF', type: 'line' }]
        },
        {
            title: 'Restricted',
            items: [{ label: 'Military', color: '#FF4136', border: 'dashed' }]
        },
        {
            title: 'Maritime',
            items: [{ label: 'EEZ Limits', color: '#666', type: 'line' }]
        }
    ]

    const renderIcon = (item) => {
        if (item.emoji) {
            return (
                <div style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: item.color,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    border: '1px solid white'
                }}>
                    {item.emoji}
                </div>
            )
        }

        if (item.icon === 'triangle-neon') {
            return (
                <svg width="16" height="16" viewBox="0 0 20 20" style={{ filter: 'drop-shadow(0 0 1px #00FFFF)' }}>
                    <path d="M10 4 L14 15 L6 15 Z" fill={item.color} />
                </svg>
            )
        }

        if (item.type === 'line') {
            return (
                <div style={{
                    width: '16px',
                    height: '3px',
                    backgroundColor: item.color,
                    borderRadius: '1px'
                }} />
            )
        }

        if (item.border === 'dashed') {
            return (
                <div style={{
                    width: '16px',
                    height: '12px',
                    border: `1px dashed ${item.color}`,
                    backgroundColor: 'rgba(255, 65, 54, 0.1)'
                }} />
            )
        }

        return null
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="glass-panel"
                style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 1000,
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    border: '1px solid var(--glass-border)'
                }}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
            </button>
        )
    }

    return (
        <div
            className="glass-panel"
            style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                zIndex: 1000,
                padding: '12px',
                width: '260px',
                pointerEvents: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                userSelect: 'none'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                <h3 style={{
                    margin: '0',
                    fontSize: '11px',
                    color: '#888',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    Legend
                </h3>
                <button
                    onClick={() => setIsOpen(false)}
                    style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '0', display: 'flex' }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                rowGap: '12px',
                columnGap: '16px'
            }}>
                {sections.map(section => (
                    <div key={section.title}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-color)', marginBottom: '5px', opacity: 0.9 }}>
                            {section.title}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {section.items.map(item => (
                                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '16px', display: 'flex', justifyContent: 'center' }}>
                                        {renderIcon(item)}
                                    </div>
                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap' }}>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Legend
