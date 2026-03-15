import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import io from 'socket.io-client';
import api from '../services/api';
import * as crypto from '../services/crypto';

// Global socket instance
export let globalSocket = null;

const GlobalSetup = () => {
    const location = useLocation();
    const isInitialized = useRef(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || isInitialized.current) return;

        // 1. Initialize Global Socket
        if (!globalSocket) {
            globalSocket = io('/', { 
                path: '/api/socket.io',
                auth: { token }
            });

            globalSocket.on('connect', () => console.log('🐾 Cat globally connected!'));
        }

        // 2. Initialize Keys & Update Public Key (so pouncers can whisper immediately)
        const setupKeys = async () => {
            try {
                const myKeyPair = await crypto.getOrGenerateKeyPair();
                const pubKeyBase64 = await crypto.exportPublicKey(myKeyPair.publicKey);
                
                // Fetch current user and update profile if key is missing/changed
                const userRes = await api.get('/auth/me');
                if (userRes.data.publicKey !== pubKeyBase64) {
                    await api.put('/auth/profile', { publicKey: pubKeyBase64 });
                }
            } catch (err) {
                console.error("Global Key Setup Error:", err);
            }
        };
        setupKeys();

        isInitialized.current = true;

        return () => {
            // We don't want to disconnect the global socket on every re-render,
            // but we might want to clean up if the user logs out.
        };
    }, [location.pathname]); // Re-check if path changes (e.g., after login)

    return null;
};

export default GlobalSetup;
