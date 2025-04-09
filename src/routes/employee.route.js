import express from "express";
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employee.controller.js";
import authorize from "../middlewares/authorize.middleware.js";
const router = express.Router();

router
  .route("/")
  .get(getEmployees)
  .post(authorize(["admin", "hr"]), createEmployee);
router
  .route("/:id")
  .get(getEmployeeById)
  .put(authorize(["admin", "hr"]), updateEmployee)
  .delete(authorize(["admin", "hr"]), deleteEmployee);

export default router;
