<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/scroll-text.svg" alt="Scroll Icon" width="80" height="80">
  <h1>Petty Revenge Notes</h1>
  <p><strong>A production-grade social ledger for public grievances, built with uncompromising engineering standards.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express" />
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
  </p>
</div>

<br />

## 📖 The Ledger
Petty Revenge Notes is a specialized social platform where users can document, share, and interact with "petty revenge" stories. While the frontend presents a bespoke, vintage-paper aesthetic (complete with typography like IM Fell English and Crimson Text), the backend is engineered to handle high-concurrency social interactions, strict rate-limiting, and complex cascading data mutations safely.

This is not a minimum viable product. It is a showcase of defensive backend engineering, optimized database schemas, and robust state management.

---

## 🏗️ Architecture & Stack

### Frontend
- **Framework:** Next.js 16 (App Router) + React 19
- **State Management:** Redux Toolkit (Modular slices for Auth, Notes, Comments, and UI state)
- **Styling:** Tailwind CSS v4 + bespoke CSS-in-JS properties for complex gradient blending and paper textures.
- **Components:** Headless approach utilizing `lucide-react` and `react-hot-toast` for unobtrusive UX.

### Backend
- **Core:** Node.js + Express 5
- **Database:** MongoDB (via Mongoose) operating within a Replica Set to enable ACID compliance.
- **Caching & Locks:** Redis (`ioredis`) for atomic operations, OTP state, and distributed rate limiting.
- **Authentication:** Dual-token strategy. Short-lived JWT access tokens delivered via payload, paired with long-lived, HTTP-only, secure refresh tokens.
- **Infrastructure:** Brevo API for transactional email delivery (bypassing SMTP unreliability).

---

## ⚡ Engineering Highlights

### 1. Atomic Data Erasure (MongoDB Transactions)
Account deletion in a social graph is notoriously dangerous. Leaving orphaned comments or inaccurate like counters corrupts the system over time.
- **Implementation:** The account deletion flow operates inside a strict `mongoose.startSession()` transaction block.
- **Cascading Logic:** When a user deletes their account, the system:
  1. Deletes all interactions (by anyone) on the user's notes.
  2. Deletes the user's notes.
  3. Finds all likes/reactions the user left on *other* people's notes, removes them, and dynamically decrements the denormalized counters on the target notes.
  4. Recursively deletes the user's comments *and any replies made to those comments by others* (preventing dangling UI threads).
  5. Finally, deletes the User record.
- **Result:** If the server crashes at step 4, the transaction aborts. The database state remains 100% consistent. Zero orphaned documents.

### 2. Concurrency-Safe OTP Flow (Redis `WATCH`/`MULTI`/`EXEC`)
Two-factor authentication flows are heavily targeted by race-condition attacks (e.g., trying to verify the same OTP concurrently to bypass attempt limits).
- **Implementation:** OTP verification utilizes Redis Optimistic Locking.
- **Mechanism:** The backend `WATCH`es the user's OTP Redis key. It reads the current attempts. If valid, it opens a `MULTI` pipeline to decrement the attempt counter and `EXEC`s it. If a concurrent request modified the key in the exact same millisecond, the pipeline fails and returns a `409 Conflict`.
- **Result:** It is mathematically impossible to brute-force the 3-attempt limit via parallel request spamming.

### 3. Read-Optimized Data Schema (Denormalization)
Social feeds are highly read-heavy. Performing `$lookup` aggregations to count likes and comments for every note in a paginated feed destroys database performance.
- **Implementation:** The `Note` schema utilizes denormalized counter fields (`likes`, `commentsCount`, `reactionsCount.emoji`). 
- **Mechanism:** When a user likes a note, the backend performs a single atomic `$inc` operation on the Note document while simultaneously writing the Like document.
- **Result:** Fetching the main feed is an `O(1)` query operation per document. No aggregations required.

### 4. Distributed Rate Limiting
To protect against scraping and brute-force attacks, the API utilizes a two-tier rate limiting strategy via `express-rate-limit` backed by Redis.
- **Global API Limiter:** 100 requests per 15 minutes per IP.
- **Strict OTP Limiter:** 3 requests per hour. The key generator uses a composite key of `IP + Email` to prevent both localized spamming of a single account and distributed botnets targeting multiple accounts from a single node.

---

## 🎨 Frontend UX & State Consistency

The frontend isn't just visually distinct; it's heavily optimized for perceived performance.

- **Optimistic Updates:** When a user likes a note or adds a reaction, Redux immediately updates the local UI counter and toggles the state, providing zero-latency feedback while the Axios request resolves in the background.
- **Graceful Error Recovery:** If a background mutation fails (e.g., due to rate limiting), the Redux slice automatically rolls back the optimistic update and triggers a Toast notification.
- **Debounced Validation:** Inputs like "Identity Code" (Username) validation are debounced to prevent unnecessary API spam while typing, providing real-time availability checks via an animated `lucide-react` spinner.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- MongoDB (Replica Set required for Transactions)
- Redis Server (Local or Upstash)
- Brevo API Key

### Local Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/petty-revenge-notes.git
   cd petty-revenge-notes
   ```

2. **Configure Environment**
   Set up your `.env` files in both `frontend` and `backend` directories.
   
   *Backend (`backend/.env`):*
   ```env
   PORT=3001
   MONGO_URI=mongodb://localhost:27017/petty-revenge
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your_super_secret_key
   JWT_REFRESH_SECRET=your_refresh_secret
   BREVO_API_KEY=your_brevo_key
   BREVO_FROM_EMAIL=noreply@yourdomain.com
   NODE_ENV=development
   ```
   
   *Frontend (`frontend/.env`):*
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```

3. **Install Dependencies**
   ```bash
   # Install backend dependencies
   cd backend && npm install
   
   # Install frontend dependencies
   cd ../frontend && npm install
   ```

4. **Boot the Application**
   ```bash
   # Terminal 1: Start Backend (uses tsx)
   cd backend && npm run dev
   
   # Terminal 2: Start Frontend
   cd frontend && npm run dev
   ```

Open `http://localhost:3000` in your browser to begin recording grievances.

---

<div align="center">
  <p><i>"The finest architecture is built on the pettiest of foundations."</i></p>
</div>
