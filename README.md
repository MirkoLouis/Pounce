# Pounce: The Alab Gig Market 🐾 (v1.0.1-Beta)

**Pounce** is a hyper-localized micro-task marketplace designed specifically for the **Mindanao State University - Iligan Institute of Technology (MSUIIT)** community. It connects students (the "CATS") who need tasks done with fellow students who have the specialized expertise from their respective colleges.

## 🐾 The Concept
In the MSUIIT ecosystem, every "Cat" has a specialty. **Pounce** allows students to post "Gigs" and target specific academic expertise across all 7 colleges. Since complex problems often require a team, Pounce supports **Squad Gigs** where multiple specialists (e.g., an Engineer, a Programmer, and a Writer) can all pounce on the same job and collaborate in a secure group environment.

## 🚀 Key Features
- **Unified Ecosystem Launcher (`launch.sh`):** Start the Server, Client, and Bot Swarm concurrently. Includes built-in database safety checks.
- **The Pouncer Dashboard:** Horizontal carousels for *Recommended*, *Live Ticker*, *PHP Rewards*, and *Misc* jobs with **Infinite Scrolling**.
- **Instant Pounce:** One-click pounce redirects directly to the conversation and sends an automated "Pounce Intro" message.
- **WhisperSquad (Group E2EE):** Fully encrypted communication using ECDH P-256 + AES-GCM 256. Decryption happens purely on the client-side.
- **Top Colleges Leaderboard:** Real-time visualization of the most active colleges in the pride.
- **Database Safety:** Built-in pre-launch checks to ensure MongoDB is active before startup.

## 🛠 Tech Stack
- **Frontend:** React (TypeScript/Vite), Framer Motion, Tailwind CSS, Lucide Icons.
- **Backend:** Node.js (Express), Socket.io (Real-time events).
- **Database:** MongoDB (Mongoose) with performance-optimized indexing.
- **Security:** JWT Authentication + Web Crypto API for End-to-End Encryption.

## 🏁 Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **MongoDB** (Ensure `mongod` is running on port 27017)

### 2. Setup
Clone the repository and install dependencies in the root directory:
```bash
git clone <repo-url>
cd pounce
npm install
```

### 3. Environment
Copy the example environment file and customize as needed:
```bash
cp .env.example .env
```
*(Ensure `server/.env` also exists or is correctly referenced by the backend.)*

### 4. Launch the Pride
Start the entire ecosystem (Server, Client, and Bot Swarm) concurrently:
```bash
./launch.sh
# OR
npm start
```

## 🤖 Advanced CLI Commands
- **`npm run seed`**: Populates the database with 10 random "Cats" and 30 fresh "Gigs" across all colleges.
- **`npm run bot`**: Spawns an autonomous swarm of 50+ bots that create, pounce, and finish gigs in real-time.

## 🎓 MSUIIT Colleges Covered
- **CASS** - College of Arts & Social Sciences
- **COET** - College of Engineering and Technology
- **CSM** - College of Science & Mathematics
- **CED** - College of Education
- **CBAA** - College of Business Administration & Accountancy
- **CCS** - College of Computer Studies
- **CHS** - College of Health Sciences

---
*Created by Mark Leo Bagood for MSUIIT Pride. 🐾*
