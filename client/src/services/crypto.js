// WhisperSquad E2EE Utility using Web Crypto API
// Protocol: ECDH (P-256) for Key Exchange + AES-GCM for Content Encryption

export const generateKeyPair = async () => {
    return await window.crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: "P-256" },
        true,
        ["deriveKey"]
    );
};

export const exportPublicKey = async (publicKey) => {
    const exported = await window.crypto.subtle.exportKey("spki", publicKey);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
};

export const importPublicKey = async (base64Key) => {
    const binaryKey = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
    return await window.crypto.subtle.importKey(
        "spki", binaryKey, { name: "ECDH", namedCurve: "P-256" }, true, []
    );
};

export const deriveSharedSecret = async (privateKey, publicKey) => {
    return await window.crypto.subtle.deriveKey(
        { name: "ECDH", public: publicKey },
        privateKey,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
};

export const encryptMessage = async (text, sharedKey) => {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedText = new TextEncoder().encode(text);
    const encrypted = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        sharedKey,
        encodedText
    );
    
    // Return Base64 of [IV + EncryptedContent]
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    return btoa(String.fromCharCode(...combined));
};

export const decryptMessage = async (base64Payload, sharedKey) => {
    try {
        const combined = Uint8Array.from(atob(base64Payload), c => c.charCodeAt(0));
        const iv = combined.slice(0, 12);
        const encrypted = combined.slice(12);
        
        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            sharedKey,
            encrypted
        );
        return new TextDecoder().decode(decrypted);
    } catch (err) {
        console.error("❌ Decryption failed:", err);
        return "[Message could not be decrypted]";
    }
};
