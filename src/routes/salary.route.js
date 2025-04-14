import express from "express";
import {
  getSalaries,
  getSalaryByEmployeeId,
  createOrUpdateSalary,
  deleteSalary,
} from "../controllers/salary.controller.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = express.Router();

router.route("/").get(getSalaries).post(createOrUpdateSalary);
router.route("/:id").delete(deleteSalary);
router.route("/employee/:employeeId").get(getSalaryByEmployeeId);

export default router;
