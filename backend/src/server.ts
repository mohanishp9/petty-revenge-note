import express from 'express';
import type { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";
import publicNoteRoutes from "./routes/publicNote.route"
import protectedNoteRoutes from "./routes/protectedNote.route"

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true,
    })
);

app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/public/notes", publicNoteRoutes);
app.use("/api/protected/notes", protectedNoteRoutes);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("ERROR 💥:", err);

    const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

    res.status(statusCode).json({
        success: false,
        message: err.message || "Server Error",
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
});

connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}).catch((err) => {
    console.error('Failed to connect to database: ', err);
    process.exit(1);
})
