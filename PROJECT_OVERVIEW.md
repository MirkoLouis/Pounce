# Project Overview: Pounce (Alab-MSUIIT) 🐾

## 🏗 Architecture
Pounce is built on a modern **MERN-like** stack, augmented with **WebSockets** for real-time interactivity and **Web Crypto API** for zero-knowledge end-to-end encryption.

### 1. Zero-Knowledge E2EE (WhisperSquad)
- **Key Exchange:** Uses **ECDH (Elliptic Curve Diffie-Hellman)** over the P-256 curve.
- **Key Persistence:** Local key pairs are stored in the browser's **IndexedDB** to survive sessions.
- **Encryption:** Messages are encrypted/decrypted purely on the client-side using **AES-GCM 256**.
- **Privacy:** The server only stores base64-encoded ciphertexts and initialization vectors (IVs). It never sees the raw message content or the shared secret.

### 2. Real-Time Infrastructure
- **Socket.io:** Powers the live marketplace feed, user presence tracking, and instant messaging.
- **Presence Tracking:** Managed in-memory on the server for speed, with persistent "Last Seen" updates in MongoDB.
- **Broadcasts:** Actions like creating a gig, pouncing, or completing a task trigger global status updates across all connected clients.

### 3. Data Architecture (NoSQL)
- **MongoDB:** Serves as the primary data store.
- **Optimized Indexing:** Performance-critical indexes on `status`, `targeted_expertises`, and `members` to handle high-concurrency bot simulation.
- **Complex Aggregation:**
    - **College Activity:** Joins Gigs and Users to rank colleges by completion rates.
    - **Market Analytics:** Analyzes reward distributions and platform-wide statistics.
    - **Search:** Native MongoDB Text Indexing for full-text keyword discovery.

## 🔄 Data Flow
1.  **Discovery:** User loads the Dashboard; backend executes parallel `Promise.all` queries to populate carousels.
2.  **Interaction:** User "Pounces" on a gig; Socket.io creates a secure room and notifies the requester.
3.  **Communication:** Users exchange public keys via the server, derive a shared secret, and begin encrypted communication.
4.  **Completion:** Requester marks the gig as done; database updates, stats refresh globally, and the chat is locked.

## 🤖 Simulation & Seeding
- **Seeder:** Generates realistic MSUIIT student profiles mapped to actual colleges and programs.
- **Swarm Engine:** An autonomous bot simulator where dozens of "Cats" independenty interact with the market to keep it "alive" for testing and demonstration.

---
*Developed for MSUIIT Pride. 🐾*
