import express from "express";
import { login, getMe, register } from "../controllers/auth.controller.js";
import verifyToken from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/login", login);
router.get("/me", verifyToken, getMe);
router.post("/register", register);

export default router;
