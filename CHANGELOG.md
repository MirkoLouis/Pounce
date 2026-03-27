# CHANGELOG.md

## 2026-03-25 18:00
### Version-0.5.3-Alpha+202603251800

**FIXED:**
- **Code Clarity:** Standardized purpose-driven comments across the entire codebase (frontend and backend) explaining the "why" behind every major logic block.
- **Visual UX:** Refined the Gig Details modal to show a loader specifically for images while keeping the title visible immediately.

**ADDED:**
- **Architectural Documentation:** Created `NOSQL_DESIGN.md` detailing the system's problem description, collection schemas, and complex aggregation pipelines.
- **Top Colleges Leaderboard:** Integrated a new MongoDB aggregation query to track and visualize successful gig completions per college.
- **NoSQL Requirements:** Completed all requirements for the "Design Your Own NoSQL Application" subject, including 3+ distinct aggregation pipelines and CRUD operations.

## 2026-03-25 17:30
### Version-0.5.2-Alpha+202603251730

**FIXED:**
- **Schema Refactoring:** Completely removed the unused `skills` attribute from the User model and all related seeding/simulation scripts to streamline student identity.
- **Identity Recommendations:** Refined the "Recommended" algorithm to focus strictly on college and course identifiers for more accurate gig matching.

**ADDED:**
- **PHP Rewards Carousel:** Integrated a dedicated carousel for gigs offering monetary (PHP) incentives, positioned prominently before the miscellaneous rewards section.
- **Static Live Ticker UX:** Formally disabled all navigation and scrolling for the Live Ticker to ensure it acts as a constant, 5-slot fresh feed of the latest marketplace activity.

## 2026-03-25 17:00
### Version-0.5.1-Alpha+202603251700

**FIXED:**
- **Reward Consistency:** Resolved a logic error in the simulator and seeding scripts where `CUSTOM` reward types were assigned monetary values; rewards now strictly match their designated type.
- **Market Balancing:** Adjusted swarm probabilities to increase the gig creation rate, preventing the "market depletion" scenario where bots pounced faster than new needs were posted.
- **Ticker Overflow:** Restricted the Live Ticker to exactly the 5 most recent gigs to prevent horizontal scrolling and keep the most urgent needs front-and-center.

**ADDED:**
- **Static Live Ticker:** Removed navigation arrows and disabled scrolling for the "Live Ticker" carousel to maintain a clean, auto-updating headline view.
- **Simulator Independence:** Refined the bot engine to support truly asynchronous, independent routines where each bot manages its own state and randomized action clock.

## 2026-03-25 16:30
### Version-0.5.0-Alpha+202603251630

**FIXED:**
- **Race Conditions:** Strictly enforced single-pouncer logic in the backend to prevent multiple bots/users from colliding on the same gig simultaneously.
- **Visual Clipping:** Updated gig titles in the details modal to use `leading-tight`, preventing italicized font overhangs from being visually cut off.
- **Sync Issues:** Fixed a bug where UI carousels and search results didn't immediately remove gigs that were no longer "OPEN."

**ADDED:**
- **Swarm Engine V5:** Implemented a high-concurrency bot simulator where 50+ bots operate as autonomous, independent routines with their own memory and randomized action loops.
- **E2EE Bot Handshakes:** Bots now participate in the WhisperSquad protocol, generating real P-256 keys and performing ECDH handshakes to send fully encrypted whispers.
- **Unread Notification System:** Added a database-backed "unread" indicator that tracks `lastRead` timestamps per member, reflecting real-time activity on the Dashboard and Chat sidebar.
- **Real-time Stat Streams:** The "Pride Activity" widget now utilizes WebSocket listeners to update marketplace statistics instantly as gigs are posted, pounced, or finished.

## 2026-03-25 15:00
### Version-0.4.0-Alpha+202603251500

**FIXED:**
- **Search UX:** Dashboard now conditionally renders search results, replacing carousels for a cleaner view during search.
- **Delete Logic:** Restricted gig deletion to the original requester and only for "OPEN" gigs, ensuring data integrity.

**ADDED:**
- **Manage My Gigs:** New "My Gigs" tab/page allowing users to view and delete their own submitted requests (CRUD completion).
- **Search Functionality:** Integrated a backend-powered search bar on the Dashboard for easy data retrieval.
- **Data Visualization:** Added a "Pride Activity" widget on the Dashboard showing real-time distribution of gig statuses.
- **Backup Feature:** Implemented a JSON data export feature in the Profile Modal for user data backup.

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
