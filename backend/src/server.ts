import express from 'express';
import type { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
dotenv.config();

// Validate environment variables first to fail fast if missing
import { env } from './config/env';

import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';

import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";
import publicNoteRoutes from "./routes/publicNote.route";
import protectedNoteRoutes from "./routes/protectedNote.route";
import userRoutes from "./routes/user.routes";
import adminAuthRoutes from "./routes/adminAuth.routes";
import adminRoutes from "./routes/admin.routes";

const app: Application = express();

// Required by express-rate-limit when deploying behind a proxy like Render
app.set('trust proxy', 1);

const PORT = env.PORT;

app.use(helmet());
app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
    cors({
        origin: [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "https://petty-revenge-note.vercel.app",
            "https://admin-panel-petty-note.vercel.app"
        ],
        credentials: true,
    })
);

app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public/notes", publicNoteRoutes);
app.use("/api/protected/notes", protectedNoteRoutes);

// Health check endpoint (Keep-Alive for Render free tier)
app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({ status: "UP", timestamp: new Date().toISOString() });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("ERROR 💥:", err);

    const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

    res.status(statusCode).json({
        success: false,
        message: err.message || "Server Error",
        stack: env.NODE_ENV === "development" ? err.stack : undefined,
    });
});

connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}).catch((err) => {
    console.error('Failed to connect to database: ', err);
    process.exit(1);
})
