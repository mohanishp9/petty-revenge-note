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
* Redis
* JSON Web Tokens (JWT)
* Helmet, Morgan, Envalid

## Features & Implementation

### Admin & Moderation
The admin panel includes tools for managing users, notes, and comments. It features:
* Global system controls (maintenance mode, toggle signups).
* Audit logging for admin actions.
* Filtering and sorting for moderation tables.

### Data Deletion
Account and content deletion uses MongoDB transactions (`mongoose.startSession()`). The deletion cascades through the user's notes, comments, and likes. If a step fails, the transaction aborts to maintain database consistency.

### OTP Verification
OTP flows use Redis optimistic locking. The backend uses `WATCH`/`MULTI`/`EXEC` to track and limit verification attempts, preventing race conditions from concurrent requests.

### Data Schema
The `Note` schema uses denormalized counter fields (`likes`, `commentsCount`). When a user interacts with a note, the backend performs an `$inc` operation on the Note document alongside the specific interaction record to avoid aggregation queries on read.

### Rate Limiting
The API uses `express-rate-limit` with a Redis store. It applies a general rate limit across all routes and a stricter limit for OTP endpoints using an IP and Email composite key.

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
   MONGO_URI=mongodb://host.docker.internal:27017/petty-revenge
   REDIS_HOST=redis
   REDIS_PORT=6379
   JWT_SECRET=your_secret_key
   JWT_REFRESH_SECRET=your_refresh_secret
   BREVO_API_KEY=your_brevo_key
   BREVO_FROM_EMAIL=noreply@yourdomain.com
   NODE_ENV=development
   ```

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
