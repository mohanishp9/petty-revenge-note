import express from "express";
import type { Application, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";
import publicNoteRoutes from "./routes/publicNote.route";
import protectedNoteRoutes from "./routes/protectedNote.route";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for production (Heroku, Vercel, etc.)
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

// Validate required environment variables
const requiredEnvVars = ["MONGO_URI", "JWT_SECRET", "JWT_REFRESH_SECRET"];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`ERROR: ${envVar} is not defined in environment variables`);
        process.exit(1);
    }
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || [
    "http://localhost:3000",
    "http://localhost:3001",
];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, Postman, etc.)
            if (!origin) return callback(null, true);
            
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Access-Token", "X-Refresh-Token"],
    })
);

app.use(cookieParser());

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/public/notes", publicNoteRoutes);
app.use("/api/protected/notes", protectedNoteRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("ERROR 💥:", err);

    const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

    // Handle specific error types
    if (err.name === "UnauthorizedError") {
        return res.status(401).json({
            success: false,
            message: "Invalid token",
        });
    }

    if (err.message === "Not allowed by CORS") {
        return res.status(403).json({
            success: false,
            message: "CORS policy violation",
        });
    }

    res.status(statusCode).json({
        success: false,
        message: err.message || "Server Error",
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
});

// Start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
}).catch((err) => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
});

export default app;
