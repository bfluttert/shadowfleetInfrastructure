import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const ShipContext = createContext(null);

export const ShipProvider = ({ children }) => {
    const shipsRef = useRef(new Map());
    const [connectionStatus, setConnectionStatus] = useState('disconnected');

    useEffect(() => {
        // Connect to the backend proxy
        const socket = io('http://localhost:3001');

        socket.on('connect', () => {
            console.log("Connected to Ship Proxy");
            setConnectionStatus('connected');
        });

        socket.on('ship-update', (ship) => {
            // Update the map with fresh data
            shipsRef.current.set(ship.mmsi, {
                ...ship,
                ts: Date.now()
            });
        });

        socket.on('disconnect', () => {
            console.log("Disconnected from Ship Proxy");
            setConnectionStatus('disconnected');
        });

        // Periodic cleanup of stale ships (ghosts)
        const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 mins
        const pruneTimer = setInterval(() => {
            const now = Date.now();
            let deleted = 0;
            for (const [mmsi, data] of shipsRef.current) {
                if (now - data.ts > STALE_THRESHOLD_MS) {
                    shipsRef.current.delete(mmsi);
                    deleted++;
                }
            }
            if (deleted > 0) console.log(`Pruned ${deleted} stale vessels`);
        }, 60 * 1000);

        return () => {
            socket.disconnect();
            clearInterval(pruneTimer);
        };
    }, []);

    return (
        <ShipContext.Provider value={{ shipsRef, connectionStatus }}>
            {children}
        </ShipContext.Provider>
    );
};

export const useShips = () => {
    const context = useContext(ShipContext);
    if (!context) {
        throw new Error('useShips must be used within a ShipProvider');
    }
    return context;
};
