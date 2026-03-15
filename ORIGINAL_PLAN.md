# Original Project Plan (Pounce)

## Original README.md

# Pounce: The Alab Gig Market 🐾

**Pounce** is a hyper-localized micro-task marketplace designed specifically for the **Mindanao State University - Iligan Institute of Technology (MSUIIT)** community. It connects students (the "CATS") who need tasks done with fellow students who have the specialized expertise from their respective colleges.

## 🐾 The Concept
In the MSUIIT ecosystem, every "Cat" has a specialty. **Pounce** allows students to post "Gigs" and target specific academic expertise across all 7 colleges. Since complex problems often require a team, Pounce supports **Squad Gigs** where multiple specialists (e.g., an Engineer, a Programmer, and a Writer) can all pounce on the same job and collaborate in a secure group environment.

## 🚀 Refined Features
- **Flexible Requesting:** Post gigs with descriptions (max 500 chars), up to 10 images, and targeted expertise across multiple colleges/courses.
- **Squad Formation:** Requesters can accept multiple "Pouncers" for a single job, automatically forming a collaborative squad.
- **The Pouncer Dashboard:** A cat-themed hub featuring horizontal carousels for *All*, *Recommended*, *Misc*, and *Random* jobs.
- **Instant Pounce:** One click notifies the requester and immediately adds the Pouncer to the gig's secure group chat.
- **WhisperSquad (Group E2EE):** Encrypted group communication where every member is verified. Pouncers send a customizable "First Pounce" message upon joining.
- **Job Finalization:** Requesters can mark jobs as "Done/Paid" for the entire squad or individual members.

## 🛠 Tech Stack
- **Database:** MongoDB (Profiles, Gig History, Images, and Custom Auto-Messages).
- **Cache/Real-time:** Redis (Signaling, Live Notifications, and Presence).
- **Communication:** WebSockets & WebRTC (Direct P2P Data Channels).
- **Security:** End-to-End Encryption (E2EE) via Web Crypto API.

## 🎓 MSUIIT Colleges Covered
- **CASS** (Arts & Social Sciences)
- **COET** (Engineering & Technology)
- **CSM** (Science & Mathematics)
- **CED** (Education)
- **CBAA** (Business Admin & Accountancy)
- **CCS** (Computer Studies)
- **CON** (Nursing)

---

## Original PROJECT_OVERVIEW.md

# PROJECT_OVERVIEW.md - Pounce 🐾

## 🏗 Architecture & Flow Diagram
```mermaid
graph TD
    UserA[Requester] -->|1. Post Gig| Modal[Request Modal]
    Modal -->|2. Data Save| Mongo[(MongoDB)]
    Mongo -->|3. Notify| Redis[Redis Pub/Sub]
    
    UserB[Pouncer 1] -->|4. Pounce| Whisper[WhisperSquad Handshake]
    UserC[Pouncer 2] -->|4. Pounce| Whisper
    
    Whisper -->|5. Auto-Message| UserA
    Whisper -->|6. Group Channel| Squad[E2EE P2P Squad Chat]
    
    UserA -->|7. Job Done| Close[Status: Completed]
```

## 🔐 WhisperChat & The "First Pounce" Flow 
WhisperChat is more than just messaging; it's a secure handshake. 
1. **The Pounce Action:** When a student clicks "Pounce" on a job, a WebSocket signal is sent to the requester.
2. **Auto-Initialization:** A new chat document is created. The Pouncer's browser automatically sends their **Custom Auto-Message** (e.g., *"Hi! I'm [Name] from CCS, I've done similar projects before. Let's talk!"*).
3. **P2P Establishment:** A WebRTC Data Channel is formed between the two users. All subsequent communication is P2P and encrypted.
4. **Finalization:** The Requester's chat view includes a **"Job Done/Paid"** button. Clicking this updates the Gig status in MongoDB and triggers a "Payment Confirmed" visual in the chat for both parties. 

## 🔐 WhisperSquad: Group E2EE
1. **The Handshake:** When a Pouncer joins a "Squad," they perform a WebRTC handshake with the Requester (the *Squad Leader*).
2. **Relay Logic:** For Group Chat, the Requester acts as a signaling node to ensure all Pouncers are synchronized.
3. **Encryption:** Each message is encrypted separately for each member of the Squad. Even with multiple "Cats" in the room, the data remains private and unreadable to the server.

## 💾 Refined Database Strategy

### MongoDB (Persistence)
- **Users Collection:** 
  - `_id`, `name`, `msu_email`, `college`, `course`, `skills[]`, `rating`.
  - `auto_pounce_message`: A user-editable string for their first message when pouncing.
- **Gigs Collection:** 
  - `_id`, `requester_id`, `pouncer_ids[]`: Array of students who have joined the squad.
  - `title`, `description` (max 500).
  - `images`: Array of up to 10 image URLs.
  - `targeted_expertises`: Array of Course IDs (supports multi-college targeting).
  - `reward`: Object containing `{ type: 'PHP' | 'CUSTOM', value: string }`.
  - `status`: `OPEN`, `IN_PROGRESS`, `COMPLETED`.

### Redis (Speed & Real-time)
- **Dashboard Feed:** Caches the "Top 5" for each carousel (All, Recommended, Misc, Random) to ensure near-instant loading.
- **Presence List:** Tracks which Cats are online to show a "Last active" status in chat.
- **Signaling:** Handles the "Offer/Answer" exchange for WebRTC.

## 🎓 Multi-Expertise Selection Logic
Requesters no longer choose a single college. Instead, the modal allows:
1. **Multi-Select College:** Choose one or more (e.g., *CCS* and *COET*).
2. **Filtered Course Checkbox:** Upon selecting a college, a list of its courses appears. The user can check as many as they want (e.g., *BS Computer Science* + *BS Mechanical Engineering*).
3. **Recommendation Engine:** The "Recommended Jobs" carousel for a Pouncer is filtered by matching these checked courses against the Pouncer's own degree program.
