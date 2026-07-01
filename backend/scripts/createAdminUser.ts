import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import AdminUser from "../src/models/AdminUser.model";

dotenv.config({ path: path.join(__dirname, "../.env") });

const createAdmin = async () => {
    try {
        const name = process.argv[2];
        const email = process.argv[3];
        const password = process.argv[4];

        if (!name || !email || !password) {
            console.error("Missing arguments!");
            console.log("Usage: npx ts-node scripts/createAdminUser.ts <name> <email> <password>");
            process.exit(1);
        }

        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            console.error("MONGO_URI is not defined in the environment variables.");
            process.exit(1);
        }

        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB...");

        const existingAdmin = await AdminUser.findOne({ email: email.toLowerCase().trim() });
        if (existingAdmin) {
            console.error(`Admin user already exists with email: ${email}`);
            process.exit(1);
        }

        const admin = await AdminUser.create({
            name,
            email,
            password,
            isSuperAdmin: true,
        });

        console.log(`Success! Super Admin ${admin.name} (${admin.email}) has been created.`);
        process.exit(0);
    } catch (error) {
        console.error("Error creating admin user:", error);
        process.exit(1);
    }
};

createAdmin();
