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
