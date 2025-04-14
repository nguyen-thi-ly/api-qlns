import express from "express";
import multer from "multer";
import { importAttendance, getAttendance, getAllAttendance } from "../controllers/attendance.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/import", upload.single("file"), importAttendance);
router.get("/employee", getAttendance);
router.get("/", getAllAttendance);

export default router;
