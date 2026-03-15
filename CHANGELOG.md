# CHANGELOG.md

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
