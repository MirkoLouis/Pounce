# CHANGELOG.md

## 2026-03-19 17:30
### Version-0.3.0-Alpha+202603191730

**FIXED:**
- **Inactivity Logic (AFK):** Users now show as "Cat is Away" if they are connected but haven't interacted with the app for 5 minutes.
- **Payload Limits:** Increased server JSON limit to 50MB to support high-resolution Base64 image uploads.
- **Image Compatibility:** Migrated from temporary Blobs to permanent Base64 strings for gig images, fixing security errors in LibreWolf.
- **Live Sync:** Added `gig_status_update` events to remove pounced or completed gigs from all users' carousels instantly.
- **Reactive Sockets:** Implemented `SocketProvider` and `useSocket` hook to ensure real-time listeners attach correctly even during rapid page refreshes.
- **Session Integrity:** Updated auth middleware to verify user existence in DB, ensuring 100% reliable logouts after database resets.

**ADDED:**
- **Activity Heartbeats:** Server now tracks `lastSeen` timestamps via API middleware and Socket.io events.
- **Real-time Notifications:** Dashboard chat icon now shows a real-time notification dot when a new pounce occurs.
- **Strict Validation:** `RequestGigModal` now enforces required fields (Title, Description, College, Course) and restricts reward inputs (numeric cash, 50-char custom).

## 2026-03-19 15:00
### Version-0.2.0-Alpha+202603191500

**FIXED:**
- **Chat Reliability:** Refactored messaging logic to save to MongoDB before emitting, ensuring history and real-time stay synchronized.
- **Multi-tab Presence:** Implemented in-memory socket counting to prevent users from showing as "Offline" when closing only one of multiple open tabs.
- **Background Notifications:** Users now receive messages via personal rooms (`user_${userId}`), ensuring updates arrive even when the specific chat view is not active.

**ADDED:**
- **Pure MongoDB Architecture:** Removed Redis dependency, consolidating all persistent and transient state (presence tracking) into MongoDB to simplify the stack and deployment.
- **Persistent Presence State:** Added `isOnline` and `lastSeen` fields to the User model, making status available even after server restarts.

## 2026-03-15 19:55
### Version-0.1.0-Alpha+202603151955

**ADDED:**
- **Encrypted History Persistence:** Encrypted message hashes are now stored on the server and decrypted locally, ensuring chats survive refreshes and cache clears.
- **Global Presence System:** Integrated Redis to track real-time "Online/Offline" status globally.
- **Infinite Scrolling:** Dashboard carousels now support autonomous pagination for bottomless scrolling.
- **Real-time Feed:** New gigs are injected into carousels instantly via Socket.io without page refreshes.
- **Persistent E2EE Keys:** Key pairs are now stored in **IndexedDB**, maintaining the validity of shared secrets across sessions.
- **Automated Pounce Flow:** Successfully pouncing now redirects directly to the conversation and automatically sends the user's custom intro message.
- **Global Setup:** A new global initialization layer ensures sockets and keys are ready as soon as a user logs in.

**FIXED:**
- **Gig Details Layout:** Redesigned the modal to be more compact, expanded width to `max-w-5xl`, and set a fixed height for consistent rendering.
- **Expertise Rendering:** Eligibility (Expertise) now uses individual rows for better readability of long lists.
- **Server Stability:** Resolved a critical crash in the Socket.io authentication middleware related to JWT payload structure.
- **UI Theme:** Standardized on a unified white background for modals, removing inconsistent gray slate artifacts.
- **Repository Management:** Created a standard `.gitignore` to prevent tracking of environment variables and node modules.

## 2026-03-15 15:30
### Version-Alpha+202603151530

**ADDED:**
- Initial project structure for **Pounce (MSUIIT Gig Market)**.
- `README.md` with project vision and CATS branding.
- `PROJECT_OVERVIEW.md` detailing Redis/MongoDB/WebSockets/E2EE architecture.
- Full MSUIIT College/Program mapping research and integration.

**FIXED:**
- Pivoted from "Google Docs Clone" case study to a more complex, database-heavy "MSUIIT Gig Marketplace" to better demonstrate Redis/MongoDB strengths and avoid Tiptap pagination issues.
