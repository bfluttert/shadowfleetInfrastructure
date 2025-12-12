import React, { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

const ShipLayer = ({ shipsRef, onSelect }) => {
    const map = useMap()
    const canvasRef = useRef(null)

    useEffect(() => {
        // Create a custom Leaflet Canvas Pane if needed, but overlaying a separate canvas 
        // that syncs with the map is often smoother for high-frequency updates 
        // than hooking into Leaflet's internal renderer for every frame.
        // OR: We can use a standard HTML5 Canvas on top of the map div.

        // Simpler approach compatible with React-Leaflet:
        // Add a canvas element to the map's overlay pane.

        const canvas = L.DomUtil.create('canvas', 'leaflet-ship-layer')
        const size = map.getSize()
        canvas.width = size.x
        canvas.height = size.y
        canvas.style.position = 'absolute'
        canvas.style.top = 0
        canvas.style.left = 0
        canvas.style.pointerEvents = 'none' // Click-through for map dragging
        canvas.style.zIndex = 600 // Requested Z-index

        const overlayPane = map.getPanes().overlayPane
        overlayPane.appendChild(canvas)
        canvasRef.current = canvas

        // Animation Loop
        let animationFrameId

        const render = () => {
            if (!map || !canvas) return

            const ctx = canvas.getContext('2d')
            if (!ctx) return

            // Clear
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Draw each ship
            // ShipsRef is a Map
            shipsRef.current.forEach(ship => {
                if (!ship.lat || !ship.lon) return

                // Project LatLng to Container Point (Pixel coords usually relative to map container)
                // But since our canvas is in the overlay pane, we need to be careful about offset.
                // The overlay pane moves with the map drag. 
                // Leaflet's L.map.latLngToLayerPoint accounts for zoom/pan transform.

                const point = map.latLngToLayerPoint([ship.lat, ship.lon])

                // Optimization: Skip off-screen ships? 
                // Canvas can handle a few thousand draws, but culling helps.
                // For now, draw all.

                ctx.save()
                ctx.translate(point.x, point.y)

                // Rotation
                const angle = (ship.cog || 0) * (Math.PI / 180)
                ctx.rotate(angle)

                // Draw Neon Triangle
                ctx.beginPath()
                ctx.moveTo(0, -6) // Nose
                ctx.lineTo(5, 5)  // Back Right
                ctx.lineTo(-5, 5) // Back Left
                ctx.closePath()

                ctx.fillStyle = '#00FFFF' // Cyan/Neon
                ctx.shadowColor = '#00FFFF'
                ctx.shadowBlur = 4
                ctx.fill()

                ctx.restore()
            })

            animationFrameId = requestAnimationFrame(render)
        }

        // Handle Resize / Zoom
        // When zooming/panning, Leaflet modifies the transform of the pane.
        // However, we need to reset the canvas size and clear if the zoom changes scale too much?
        // Actually, if we append to overlayPane, Leaflet handles the pane position, 
        // BUT for a static canvas layer, we usually want to redraw on 'move' and 'zoom'.
        // If we use `latLngToLayerPoint`, it returns coords relative to the *origin* of the pane (top-left of the world at current zoom).
        // This coordinates space can be huge. 
        // A better approach for Canvas Overlay in Leaflet is `L.canvas()` based or extending `L.Renderer`.
        // BUT, implementing a raw canvas that sticks to the Viewport is easier for animation.
        // Let's try "Fixed Canvas" approach: Canvas is fixed on screen, we project LatLng to ContainerPoint.

        // Re-do setup for Fixed Canvas (better for animation):
        overlayPane.removeChild(canvas) // Remove from pane
        const container = map.getContainer() // Map div
        container.appendChild(canvas) // Add as direct child (on top)

        // Update Canvas Size
        const resize = () => {
            const s = map.getSize()
            canvas.width = s.x
            canvas.height = s.y
        }
        map.on('resize', resize)
        resize()

        // New Render Loop using ContainerPoint (Screen pixels)
        const renderFixed = () => {
            if (!map || !canvas) return
            const ctx = canvas.getContext('2d')
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            shipsRef.current.forEach(ship => {
                // Convert to container point (screen relative)
                const point = map.latLngToContainerPoint([ship.lat, ship.lon])

                // Cull off-screen
                if (point.x < -10 || point.y < -10 || point.x > canvas.width + 10 || point.y > canvas.height + 10) return

                ctx.save()
                ctx.translate(point.x, point.y)
                ctx.rotate((ship.cog || 0) * Math.PI / 180)

                ctx.beginPath()
                ctx.moveTo(0, -6)
                ctx.lineTo(4, 5)
                ctx.lineTo(-4, 5)
                ctx.closePath()

                ctx.fillStyle = '#00FFFF'
                ctx.shadowBlur = 6
                ctx.shadowColor = 'rgba(0, 255, 255, 0.8)'
                ctx.fill()
                ctx.restore()
            })

            animationFrameId = requestAnimationFrame(renderFixed)
        }

        renderFixed()

        // Interaction (Hover)
        // We attach listener to canvas
        const onMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top

            // Simple hit test
            // Iterate all ships? (Optimization: use a spatial grid if too slow, but for <2000 ships it's fine)
            let found = null
            for (const [mmsi, ship] of shipsRef.current) {
                const p = map.latLngToContainerPoint([ship.lat, ship.lon])
                const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2)
                if (dist < 10) { // 10px radius
                    found = ship
                    break
                }
            }

            if (found) {
                canvas.style.cursor = 'pointer'
                canvas.title = `${found.name} (${found.mmsi})` // Native tooltip for simplicity
            } else {
                canvas.style.cursor = 'default'
                canvas.title = ''
            }
        }
        canvas.addEventListener('mousemove', onMouseMove)


        // Click Listener
        const onClick = (e) => {
            const rect = canvas.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top

            let found = null
            // Check top-most ship first? Map order is insertion order usually.
            // Reverse iteration might be better for "top" z-index visually.
            for (const [mmsi, ship] of shipsRef.current) {
                const p = map.latLngToContainerPoint([ship.lat, ship.lon])
                const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2)
                if (dist < 15) { // 15px radius click
                    found = ship
                    break
                }
            }

            if (found && onSelect) {
                onSelect(found)
            }
        }
        canvas.addEventListener('click', onClick)

        return () => {
            cancelAnimationFrame(animationFrameId)
            map.off('resize', resize)
            canvas.removeEventListener('mousemove', onMouseMove)
            canvas.removeEventListener('click', onClick)
            canvas.remove()
        }
    }, [map, shipsRef, onSelect])

    return null
}

export default ShipLayer
