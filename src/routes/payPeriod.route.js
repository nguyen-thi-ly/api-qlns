import express from "express";
import { createPayPeriod, getPayPeriod, getPayPeriodById } from "../controllers/payPeriod.controller.js";
import authorize from "../middlewares/authorize.middleware.js";
const router = express.Router();

router.route("/").get(getPayPeriod).post(createPayPeriod);
router.route("/:id").get(getPayPeriodById);

export default router;
