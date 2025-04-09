import express from "express";
import {
  getSalaries,
  getSalaryByEmployeeId,
  createOrUpdateSalary,
  deleteSalary,
} from "../controllers/salary.controller.js";
import authorize from "../middlewares/authorize.middleware.js";

const router = express.Router();

router
  .route("/")
  .get(getSalaries)
  .post(authorize(["admin", "hr"]), createOrUpdateSalary);
router.route("/:id").delete(authorize(["admin", "hr"]), deleteSalary);
router.route("/employee/:employeeId").get(authorize(["admin", "hr"]), getSalaryByEmployeeId);

export default router;
