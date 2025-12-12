import React, { useState, useMemo } from 'react'

const VesselSearch = ({ vessels, onSelect }) => {
    const [search, setSearch] = useState('')
    const [isExpanded, setIsExpanded] = useState(false)

    const filtered = useMemo(() => {
        if (!vessels || !search) return []
        const list = Object.values(vessels)
        return list.filter(v => {
            const term = search.toLowerCase()
            return (v.vessel_name || '').toLowerCase().includes(term) ||
                (v.mmsi || '').toString().includes(term) ||
                (v.imo || '').toString().includes(term)
        }).slice(0, 10) // Limit results for UI
    }, [vessels, search])

    const handleSelect = (v) => {
        if (onSelect) onSelect(v)
        setIsExpanded(false)
    }

    return (
        <div className="absolute top-4 left-4 z-[1000] w-96 font-sans">
            {/* Search Bar Card */}
            <div className="bg-white rounded-lg shadow-lg flex items-center p-2 mb-2 border border-gray-200">
                <button className="p-2 text-gray-500 hover:text-gray-700">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
                <input
                    type="text"
                    placeholder="Search Google Maps"
                    className="flex-1 px-3 py-2 outline-none text-gray-700 placeholder-gray-400 text-base"
                    value={search}
                    onChange={e => {
                        setSearch(e.target.value)
                        setIsExpanded(true)
                    }}
                    onFocus={() => setIsExpanded(true)}
                />
                <button className="p-2 text-gray-500 hover:text-blue-600">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </button>
            </div>

            {/* Results Dropdown */}
            {isExpanded && search && (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100 max-h-[70vh] overflow-y-auto animate-fadeIn">
                    {filtered.length === 0 ? (
                        <div className="p-4 text-gray-500 text-sm text-center">
                            No vessels found associated with "{search}"
                        </div>
                    ) : (
                        filtered.map(v => (
                            <div
                                key={v.id || v.mmsi}
                                className="group px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors flex items-start gap-3"
                                onClick={() => handleSelect(v)}
                            >
                                <div className="mt-1 text-gray-400 group-hover:text-red-500">
                                    {/* Ship Icon */}
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2L2 22h20L12 2zm0 3.5L17.5 19h-11L12 5.5z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="font-medium text-gray-800 group-hover:text-black">
                                        {v.vessel_name || `Unknown Vessel (${v.mmsi})`}
                                    </div>
                                    <div className="text-sm text-gray-500 flex items-center gap-2">
                                        <span className="font-mono bg-gray-100 px-1 rounded text-xs">{v.mmsi}</span>
                                        <span>•</span>
                                        <span>{v.speed_knots?.toFixed(1) || 0} kn</span>
                                        {v.nav_status && (
                                            <>
                                                <span>•</span>
                                                <span className="capitalize text-xs">{v.nav_status.toLowerCase()}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

export default VesselSearch
