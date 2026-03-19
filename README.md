# Pounce: The Alab Gig Market 🐾

**Pounce** is a hyper-localized micro-task marketplace designed specifically for the **Mindanao State University - Iligan Institute of Technology (MSUIIT)** community. It connects students (the "CATS") who need tasks done with fellow students who have the specialized expertise from their respective colleges.

## 🐾 The Concept
In the MSUIIT ecosystem, every "Cat" has a specialty. **Pounce** allows students to post "Gigs" and target specific academic expertise across all 7 colleges. Since complex problems often require a team, Pounce supports **Squad Gigs** where multiple specialists (e.g., an Engineer, a Programmer, and a Writer) can all pounce on the same job and collaborate in a secure group environment.

## 🚀 Refined Features
- **Flexible Requesting:** Post gigs with targeted expertise across multiple colleges/courses.
- **The Pouncer Dashboard:** Horizontal carousels for *All*, *Recommended*, *Misc*, and *Random* jobs with **Infinite Scrolling** and **Real-time Updates**.
- **Instant Pounce:** One-click pounce redirects directly to the conversation and sends an automated customizable "Pounce Intro" message.
- **WhisperSquad (Group E2EE):** Encrypted communication where messages are decrypted locally. **Encrypted History** is preserved on the server, ensuring you never lose your chats.
- **Global Presence:** Real-time online/offline status indicators for all "Cats" in the pride.
- **Job Finalization:** Requesters can mark jobs as "Done/Paid" to trigger status updates and payment confirmations.

## 🛠 Tech Stack
- **Database:** MongoDB (Profiles, Presence State, Gigs, and Encrypted Message Hashes).
- **Communication:** WebSockets (Socket.io) with JWT Authentication and real-time signaling.
- **Security:** End-to-End Encryption (E2EE) via Web Crypto API (ECDH P-256 + AES-GCM 256) with persistent keys in **IndexedDB**.

## 🎓 MSUIIT Colleges Covered
- **CASS** (Arts & Social Sciences)
- **COET** (Engineering & Technology)
- **CSM** (Science & Mathematics)
- **CED** (Education)
- **CBAA** (Business Admin & Accountancy)
- **CCS** (Computer Studies)
- **CON** (Nursing)
