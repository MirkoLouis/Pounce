import React, { useEffect, useRef, useState, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../services/api';
import * as crypto from '../services/crypto';

// Export for legacy compatibility (though useSocket is preferred)
export let globalSocket = null;

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

const GlobalSetup = ({ children }) => {
    const location = useLocation();
    const [socket, setSocket] = useState(null);
    const isInitialized = useRef(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // 1. Initialize Global Socket
        if (!globalSocket) {
            const newSocket = io('/', { 
                path: '/api/socket.io',
                auth: { token }
            });

            newSocket.on('connect', () => {
                console.log('🐾 Cat globally connected!');
            });

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

        // 2. Initialize Keys & Update Public Key
        const setupKeys = async () => {
            if (isInitialized.current) return;
            try {
                const myKeyPair = await crypto.getOrGenerateKeyPair();
                const pubKeyBase64 = await crypto.exportPublicKey(myKeyPair.publicKey);
                
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
