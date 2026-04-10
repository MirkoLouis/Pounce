# CHANGELOG.md

## 2026-04-11 01:35
### Version-1.3.0-Release+202604110135

**FIXED:**
- **Dynamic API Routing:** Refactored `client/src/services/api.js` and `client/src/components/GlobalSetup.jsx` to dynamically switch between local and production backend URLs using the `VITE_API_URL` environment variable.
- **Production Port Mapping:** Ensured the backend server correctly binds to the Render-assigned `PORT` environment variable for online accessibility.

**ADDED:**
- **Cloud Infrastructure:** Successfully migrated the ecosystem to **Render** (Node.js Web Service) and **Vercel** (Vite Frontend).
- **Persistent Cloud Database:** Integrated **MongoDB Atlas** as the primary persistent data store with a verified connection string.
- **Remote Seeding:** Validated the ability to seed the live cloud database remotely using the `populate.js` script.
- **Production Deployment Strategy:** Documented the full deployment process for Vercel, Render, and Atlas in `README.md`.

## 2026-04-10 08:57
### Version-1.2.2-Alpha+202604100857

**FIXED:**
- **Syntax Integrity:** Resolved critical "Unexpected token" syntax errors in `ChatPage.jsx`, `Dashboard.jsx`, and `RequestGigModal.jsx` by removing redundant export statements and misplaced closing tags at the end of these files.

**ADDED:**
- (none)

## 2026-04-07 01:47
### Version-1.2.1-Release+202604070147

**FIXED:**
- **Codebase Documentation:** Refactored comments across all server and client files to adhere to the "COMPREHENSIVE YET CONCISE" ideology, explaining the *why* behind logic blocks.
- **Project Configuration:** Surgical cleanup of `launch.sh`, `vite.config.js`, and `tailwind.config.js` comments for better readability.
- **Version Alignment:** Synchronized `package.json`, `README.md`, and internal documentation versions to reflect the current project state.

**ADDED:**
- **Comprehensive Project Overview:** Created `PROJECT_OVERVIEW.md` detailing the E2EE architecture, real-time infrastructure, and MongoDB aggregation strategies.
- **Updated Pitch Narrative:** Completely refactored `pitch_script.md` to integrate recent technical milestones like the Bot Swarm and Monitor Center.
- **Stability Milestone:** Finalized the ecosystem documentation and refactoring phase for the first stable release candidate.

## 2026-04-06 21:00
### Version-1.2.0-Alpha+202604062100

**FIXED:**
- **Deterministic Bot Identity:** Refactored `simulator.js` and `populate.js` to use stable identity generation. This prevents bots from rotating keys on every restart, ensuring long-term chat history remains decryptable.
- **Self-Healing Bot Swarm:** Updated the simulator to listen for system-wide resets. Bots now automatically re-sync their credentials and "respawn" after a marketplace reset without requiring a process restart.
- **Seeder Integrity:** Updated the database seeder to perform a full wipe of Conversations and Messages during a reset, ensuring no orphaned encrypted data remains to clash with new keys.

**ADDED:**
- **In-App Database Reset:** Implemented a new "Database Reset" feature in the Profile Modal, exclusively for the monitor account (`markleo.bagood@g.msuiit.edu.ph`).
- **Live Marketplace Refresh:** The reset button triggers a full backend re-seed and broadcasts a `force_logout` signal to all connected clients, ensuring the entire ecosystem synchronizes with the fresh database state instantly.
- **Backend Seed API:** Exposed a secure administrative endpoint `/api/auth/reset-database` that integrates the `populate.js` logic directly into the running server.

## 2026-04-06 20:29
### Version-1.1.0-Alpha+202604062029

**FIXED:**
- **Backup Scope:** Refactored the backup feature from a per-user data export to a comprehensive full-database system dump to satisfy NoSQL subject requirements.
- **Access Control:** Restricted the high-privilege Database Backup operation exclusively to the administrator/monitor account (`markleo.bagood@g.msuiit.edu.ph`) for security and privacy.

**ADDED:**
- **Database Backup Engine:** Implemented a full JSON export of all core collections (Users, Gigs, Conversations, Messages) via the backend.
- **Embedded Aggregation Reports:** Integrated live MongoDB aggregation results (Gig Status distribution and College Activity analytics) directly into the backup JSON file.
- **Admin-Only UI:** Updated the Profile Modal to conditionally render the "Database Backup" button only for authenticated monitor accounts, while showing a privacy note to regular students.

## 2026-04-06 16:20
### Version-1.0.2-Alpha+202604061620

**FIXED:**
- **Standardized Gig Titles:** Removed forced uppercase transformation in `GigDetailsModal.jsx` and `MyGigs.jsx` to ensure gig titles, requester names, and reward values match their original database case for consistent UI.
- **Image Loading Logic:** Fixed a bug in `GigDetailsModal.jsx` where images were stuck in a loading state or showing "No Images Provided" when switching between gigs by implementing a `useEffect` reset.

**ADDED:**
- **Bot Request Images:** Updated the `simulator.js` engine to generate random image URLs for bot-created gigs, ensuring the marketplace remains visually complete and realistic.

## 2026-03-27 12:00
### Version-1.0.1-Beta+202603271200

**FIXED:**
- **System Lag:** Resolved significant dashboard lag caused by high-concurrency bot activity through database indexing and frontend memory management.
- **Aggregation Efficiency:** Optimized complex analytics queries by projecting data before performing lookups, reducing server memory usage.
- **UI Overflow:** Refined the "Top Colleges" leaderboard to strictly show the Top 3 performers for a cleaner Dashboard layout.

**ADDED:**
- **Database Indexing:** Implemented performance-critical indexes on Gigs, Users, Conversations, and Messages to support thousands of concurrent requests.
- **Parallel Query Execution:** Refactored the Dashboard backend to fetch all gig categories concurrently using `Promise.all`.
- **Full-Text Search Index:** Added a native MongoDB text index for high-speed keyword discovery across titles and descriptions.

## 2026-03-27 11:00
### Version-1.0.0-Beta+202603271100

**FIXED:**
- **College Acronyms:** Corrected the Dashboard leaderboard to use accurate college abbreviations from `colleges.json`.
- **Port Consistency:** Standardized the entire ecosystem to use port `5050` (Server) and `5173` (Client) to avoid conflicts.
- **Bot Persona:** Updated the simulation engine to use official College IDs in automated introductory messages.

**ADDED:**
- **Unified Launcher:** Created `launch.sh` to concurrently start the Server, Client, and Bot Swarm with a single command.
- **Database Safety:** Implemented a pre-launch check in the launcher that prevents startup if MongoDB is not running, with a user-friendly error message.
- **Root Management:** Added a root `package.json` to provide simplified `npm start`, `npm run seed`, and `npm run bot` commands.

## 2026-03-25 18:00
### Version-0.5.4-Alpha+202603270930
**FIXED:**
- **Server Crash:** Syntax error in gigController.js.

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
