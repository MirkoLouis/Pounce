import React, { useEffect, useRef, useState, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../services/api';
import * as crypto from '../services/crypto';

// Export for legacy compatibility
export let globalSocket = null;

// Socket context for global access
const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

/**
 * Initialize global services (Socket.io and E2EE).
 * Persistent across route changes.
 */
const GlobalSetup = ({ children }) => {
    const location = useLocation();
    const [socket, setSocket] = useState(null);
    const isInitialized = useRef(false); // Prevent redundant setup

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Init Global Socket for real-time updates
        if (!globalSocket) {
            const socketUrl = import.meta.env.VITE_API_URL || '/';
            const newSocket = io(socketUrl, { 
                path: '/api/socket.io',
                auth: { token }
            });

            newSocket.on('connect', () => {
                console.log('🐾 Cat globally connected!');
            });

            // Handle security and system resets
            newSocket.on('force_logout', () => {
                console.log('📢 System-wide logout triggered!');
                localStorage.removeItem('token');
                window.location.href = '/login';
            });

            globalSocket = newSocket;
            setSocket(newSocket);
        } else if (!socket) {
            setSocket(globalSocket);
        }

        // Init E2EE keys and sync with server
        const setupKeys = async () => {
            if (isInitialized.current) return;
            try {
                // Fetch/Generate local ECDH pair
                const myKeyPair = await crypto.getOrGenerateKeyPair();
                const pubKeyBase64 = await crypto.exportPublicKey(myKeyPair.publicKey);
                
                // Sync public key for peer handshakes
                const userRes = await api.get('/auth/me');
                if (userRes.data.publicKey !== pubKeyBase64) {
                    await api.put('/auth/profile', { publicKey: pubKeyBase64 });
                }
                isInitialized.current = true;
            } catch (err) {
                console.error("Global Key Setup Error:", err);
            }
        };
        setupKeys();

    }, [location.pathname, socket]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export default GlobalSetup;
