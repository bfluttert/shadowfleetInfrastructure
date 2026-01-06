import React, { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

const METERS_PER_NM = 1852

const niceSteps = [1, 2, 5]

const getNiceDistance = (maxMeters) => {
    if (!maxMeters || !isFinite(maxMeters)) return null

    const exponent = Math.floor(Math.log10(maxMeters))
    const base = Math.pow(10, exponent)

    for (let i = niceSteps.length - 1; i >= 0; i--) {
        const candidate = niceSteps[i] * base
        if (candidate <= maxMeters) {
            return candidate
        }
    }

    return base
}

const formatNumber = (value) => {
    if (value >= 10) return value.toFixed(0)
    if (value >= 1) return value.toFixed(1)
    return value.toFixed(2)
}

const DistanceScale = () => {
    const map = useMap()
    const controlRef = useRef(null)
    const elRef = useRef({
        root: null,
        km: { area: null, labels: [], unit: null },
        nm: { area: null, labels: [], unit: null }
    })

    useEffect(() => {
        if (!map) return

        if (controlRef.current) {
            try {
                map.removeControl(controlRef.current)
            } catch (e) {
                // ignore
            }
            controlRef.current = null
        }

        const control = L.control({ position: 'bottomright' })

        control.onAdd = () => {
            const root = L.DomUtil.create('div')
            root.className = 'glass-panel'
            root.style.padding = '10px 12px'
            root.style.fontSize = '11px'
            root.style.color = '#ffffff'
            root.style.display = 'flex'
            root.style.flexDirection = 'column'
            root.style.gap = '10px'
            root.style.pointerEvents = 'none'
            root.style.margin = '0 20px 20px 0'

            const makeRow = (unitText) => {
                const row = L.DomUtil.create('div', '', root)
                row.style.display = 'flex'
                row.style.alignItems = 'flex-end'
                row.style.gap = '10px'

                const area = L.DomUtil.create('div', '', row)
                area.style.position = 'relative'
                area.style.height = '34px'
                area.style.width = '180px'

                const labels = [0, 0.25, 0.5, 1].map((p) => {
                    const s = L.DomUtil.create('span', '', area)
                    s.style.position = 'absolute'
                    s.style.top = '0px'
                    s.style.left = `${p * 100}%`
                    s.style.fontSize = '11px'
                    s.style.lineHeight = '12px'
                    s.style.color = 'rgba(255,255,255,0.92)'
                    s.style.textShadow = '0 1px 2px rgba(0,0,0,0.65)'
                    if (p === 0) {
                        s.style.transform = 'translateX(0)'
                    } else if (p === 1) {
                        s.style.transform = 'translateX(-100%)'
                    } else {
                        s.style.transform = 'translateX(-50%)'
                    }
                    return s
                })

                const ticks = L.DomUtil.create('div', '', area)
                ticks.style.position = 'absolute'
                ticks.style.top = '14px'
                ticks.style.left = '0px'
                ticks.style.right = '0px'
                ticks.style.height = '8px'

                ;[0, 0.25, 0.5, 0.75, 1].forEach((p) => {
                    const t = L.DomUtil.create('div', '', ticks)
                    t.style.position = 'absolute'
                    t.style.left = `${p * 100}%`
                    t.style.width = '1px'
                    t.style.background = 'rgba(255,255,255,0.75)'
                    t.style.boxShadow = '0 1px 2px rgba(0,0,0,0.6)'
                    t.style.transform = 'translateX(-0.5px)'
                    t.style.height = p === 0 || p === 1 ? '8px' : '6px'
                    t.style.top = '0px'
                })

                const bar = L.DomUtil.create('div', '', area)
                bar.style.position = 'absolute'
                bar.style.left = '0px'
                bar.style.right = '0px'
                bar.style.bottom = '0px'
                bar.style.height = '10px'
                bar.style.display = 'flex'
                bar.style.border = '1px solid rgba(255,255,255,0.65)'
                bar.style.borderRadius = '4px'
                bar.style.overflow = 'hidden'
                bar.style.boxShadow = '0 0 0 1px rgba(0,0,0,0.3)'

                for (let i = 0; i < 4; i++) {
                    const seg = L.DomUtil.create('div', '', bar)
                    seg.style.flex = '1 1 0'
                    seg.style.height = '100%'

                    if (i === 0) {
                        seg.style.display = 'flex'
                        const a = L.DomUtil.create('div', '', seg)
                        const b = L.DomUtil.create('div', '', seg)
                        a.style.flex = '1 1 0'
                        b.style.flex = '1 1 0'
                        a.style.background = '#0b0f16'
                        b.style.background = '#f8fafc'
                    } else {
                        seg.style.background = i % 2 === 1 ? '#0b0f16' : '#f8fafc'
                    }
                }

                const unit = L.DomUtil.create('div', '', row)
                unit.textContent = unitText
                unit.style.fontSize = '12px'
                unit.style.fontWeight = '600'
                unit.style.lineHeight = '12px'
                unit.style.marginBottom = '2px'
                unit.style.color = 'rgba(255,255,255,0.85)'
                unit.style.textShadow = '0 1px 2px rgba(0,0,0,0.65)'
                unit.style.whiteSpace = 'nowrap'

                return { area, labels, unit }
            }

            const km = makeRow('Kilometers')
            const nm = makeRow('Nautical miles')

            elRef.current = { root, km, nm }

            return root
        }

        control.addTo(map)
        controlRef.current = control

        const updateScale = () => {
            const els = elRef.current
            if (!els?.root || !els.km?.area || !els.nm?.area) return

            const size = map.getSize()
            if (!size || !size.x || !size.y) {
                els.root.style.display = 'none'
                return
            }

            const y = size.y - 30
            const xLeft = 40
            const targetPx = 180
            const xRight = xLeft + targetPx

            const left = map.containerPointToLatLng([xLeft, y])
            const right = map.containerPointToLatLng([xRight, y])

            const maxMeters = map.distance(left, right)
            if (!maxMeters || !isFinite(maxMeters)) {
                els.root.style.display = 'none'
                return
            }

            const meters = getNiceDistance(maxMeters)
            if (!meters) {
                els.root.style.display = 'none'
                return
            }

            const widthPx = (meters / maxMeters) * targetPx
            els.root.style.display = 'flex'
            els.km.area.style.width = `${widthPx}px`
            els.nm.area.style.width = `${widthPx}px`

            const kmMax = meters / 1000
            const nmMax = meters / METERS_PER_NM

            const setLabels = (scaleEls, maxValue) => {
                if (!scaleEls?.labels || scaleEls.labels.length < 4) return
                const v0 = 0
                const v1 = maxValue * 0.25
                const v2 = maxValue * 0.5
                const v3 = maxValue

                scaleEls.labels[0].textContent = `${formatNumber(v0)}`
                scaleEls.labels[1].textContent = `${formatNumber(v1)}`
                scaleEls.labels[2].textContent = `${formatNumber(v2)}`
                scaleEls.labels[3].textContent = `${formatNumber(v3)}`
            }

            setLabels(els.km, kmMax)
            setLabels(els.nm, nmMax)
        }

        updateScale()
        map.on('zoomend', updateScale)
        map.on('moveend', updateScale)
        map.on('resize', updateScale)

        return () => {
            map.off('zoomend', updateScale)
            map.off('moveend', updateScale)
            map.off('resize', updateScale)

            if (controlRef.current) {
                try {
                    map.removeControl(controlRef.current)
                } catch (e) {
                    // ignore
                }
                controlRef.current = null
            }
        }
    }, [map])

    return null
}

export default DistanceScale
