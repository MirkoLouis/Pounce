import React, { useEffect, useRef, useState, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../services/api';
import * as crypto from '../services/crypto';

// Export for legacy compatibility (though useSocket is preferred)
export let globalSocket = null;

// Context to provide socket instance to the rest of the application
const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

/**
 * GlobalSetup Component.
 * Responsible for initializing global services like Socket.io and E2EE keys.
 * Wraps the application to ensure these services are available regardless of the current route.
 */
const GlobalSetup = ({ children }) => {
    const location = useLocation();
    const [socket, setSocket] = useState(null);
    const isInitialized = useRef(false); // Prevents redundant key setup on every render

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // 1. Initialize Global Socket: Ensures a single persistent connection for real-time updates
        if (!globalSocket) {
            const newSocket = io('/', { 
                path: '/api/socket.io',
                auth: { token }
            });

            newSocket.on('connect', () => {
                console.log('🐾 Cat globally connected!');
            });

            // Handle security events like token expiration or administrative lockouts
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

        // 2. Initialize Keys & Update Public Key: Handles E2EE registration for the user
        const setupKeys = async () => {
            if (isInitialized.current) return;
            try {
                // Generate or retrieve the user's ECDH key pair from local storage
                const myKeyPair = await crypto.getOrGenerateKeyPair();
                const pubKeyBase64 = await crypto.exportPublicKey(myKeyPair.publicKey);
                
                // Sync the local public key with the server if they differ
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
