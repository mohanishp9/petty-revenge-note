import mongoose from "mongoose";

export const connectDB = async () => {
    try{
        if(!process.env.MONGO_URI){
            throw new Error("MongoDB URI is required");
        }
        const conn = await mongoose.connect(process.env.MONGO_URI as string);

        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (err) {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    }
};