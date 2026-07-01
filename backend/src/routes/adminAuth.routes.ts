import express from "express";
import { loginAdmin, logoutAdmin, refreshAdminToken, getAdminProfile, changeAdminPassword } from "../controllers/admin/auth.controller";
import { protectAdmin } from "../middleware/adminAuth.middleware";

const router = express.Router();

router.post("/login", loginAdmin);
router.post("/refresh", refreshAdminToken);
router.post("/logout", protectAdmin, logoutAdmin);
router.get("/profile", protectAdmin, getAdminProfile);
router.put("/password", protectAdmin, changeAdminPassword);

export default router;
