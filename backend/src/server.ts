import express from 'express';
import type { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import noteRoutes from "./routes/note.route.js"

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

app.use("/api/auth" ,authRoutes);
app.use("/api/notes" ,noteRoutes);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("ERROR 💥:", err);

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Server Error",
    });
});

connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}).catch((err) => {
    console.error('Failed to connect to database: ', err);
    process.exit(1);
})
