<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/scroll-text.svg" alt="Scroll Icon" width="80" height="80">
  <h1>Petty Revenge Notes</h1>
  <p><strong>A web application where users can document and share "petty revenge" stories.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express" />
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  </p>
</div>

<br />

## Tech Stack

**Frontend**
* Next.js (App Router), React
* Redux Toolkit
* Tailwind CSS
* lucide-react, react-hot-toast

**Admin Panel**
* Next.js
* Recharts for telemetry
* Interactive data grids for moderation

**Backend**
* Node.js, Express
* MongoDB (Replica Set required for transactions)
* Redis (OTP sessions, token blacklist, rate-limit store)
* JSON Web Tokens (JWT) — access + refresh with rotation and reuse detection
* Helmet, Morgan, Envalid
* Brevo (transactional email for OTP flows)

## Features & Implementation

### Notes
Users create notes with a subject, content, category emoji, and optional username visibility. Notes support likes, emoji reactions (😠 🙄 💀 🍿 🔥), comments with replies, saves, and share count tracking.

### Admin & Moderation
The admin panel (isolated Next.js app) includes tools for managing users, notes, and comments. It features:
* Global system controls (maintenance mode, toggle signups).
* Audit logging for admin actions.
* Report queue — users can report inappropriate notes; admins review reports with full note context and decide whether to delete.
* Filtering and sorting for moderation tables.

### Authentication
Two-step OTP registration via email (Brevo). JWT access tokens (15 min) with rolling refresh tokens (7 days). Refresh token rotation is enforced — each issued refresh token is blacklisted in Redis on use, preventing reuse if a token is stolen.

### Data Deletion
Account and content deletion uses MongoDB transactions (`mongoose.startSession()`). The deletion cascades through the user's notes, reactions, likes, comments, saves, and reports. If any step fails, the transaction aborts to maintain database consistency.

### OTP Verification
OTP flows use Redis optimistic locking. The backend uses `WATCH`/`MULTI`/`EXEC` to track and limit verification attempts, preventing race conditions from concurrent requests. OTPs expire in 10 minutes with a 5-attempt limit.

### Data Schema
The `Note` schema uses denormalized counter fields (`likes`, `commentsCount`, `reactionsCount`, `savesCount`, `sharesCount`, `reportsCount`). When a user interacts with a note, the backend performs an `$inc` operation on the Note document alongside the specific interaction record to avoid aggregation queries on read.

### Rate Limiting
The API uses `express-rate-limit` with a Redis store. Rate limiters applied:
* `apiLimiter` — general limit across all routes.
* `otpRequestLimiter` — stricter limit for OTP endpoints, keyed on IP + email composite.
* `searchRateLimiter` — dedicated limit for full-text search.
* `shareRateLimiter` — dedicated limit for share count increments.

### Atlas Search Setup (Required for fuzzy search)
Petty Revenge Notes uses MongoDB Atlas Search for rich text search capabilities on notes.
If you skip this step, the app will automatically fall back to standard regex search, but you will lose typo tolerance (fuzzy matching) and text scoring.

1. In MongoDB Atlas, go to your cluster -> **Atlas Search**.
2. Click **Create Search Index**.
3. Select **JSON Editor**.
4. Set the Database and Collection (e.g. `test.notes` or `petty-revenge.notes`).
5. Set the Index Name to `note-search` (this must match exactly).
6. Use the default `dynamic: true` mapping.

## Local Setup

### Prerequisites
* Node.js
* Docker (for Redis and Backend)
* MongoDB Replica Set
* Brevo API Key (for transactional emails)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/petty-revenge-notes.git
   cd petty-revenge-notes
   ```

2. **Environment Variables**
   Create `.env` files based on `.env.example` in the `backend`, `frontend`, and `admin` directories.

   *Example `backend/.env`:*
   ```env
   PORT=3001
   MONGO_URI=Your MongoDB connection string here
   JWT_SECRET=Your JWT secret here
   JWT_REFRESH_SECRET=Your JWT refresh secret here
   JWT_ACCESS_SECRET=Your JWT access secret here

   #BREVO
   BREVO_API_KEY=Your Brevo API key here
   BREVO_FROM_EMAIL=Your Brevo from email here

   # Redis
   REDIS_HOST=Your Redis host here (default is 127.0.0.1)
   REDIS_PORT=Your Redis port here (default is 6379)
   NODE_ENV=Your Node environment here (development, production, etc.)
   ```

   > **Note:** The example above uses `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` — both are required. The README previously listed `JWT_SECRET` which does not match the actual `env.ts` config and will cause the server to fail to start.

3. **Install Dependencies**
   ```bash
   cd frontend && npm install
   cd ../admin && npm install
   ```

4. **Start the Application**
   ```bash
   # Terminal 1: Backend and Redis
   docker compose up --build

   # Terminal 2: Public Frontend (http://localhost:3000)
   cd frontend && npm run dev

   # Terminal 3: Admin Panel (http://localhost:3002)
   cd admin && npm run dev
   ```
