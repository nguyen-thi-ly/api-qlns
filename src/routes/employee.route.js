import express from "express";
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employee.controller.js";
// import authorize from "../middlewares/authorize.middleware.js";
const router = express.Router();

router.route("/").get(getEmployees).post(createEmployee);
router.route("/delete").post(deleteEmployee);
router.route("/:id").get(getEmployeeById).put(updateEmployee);

export default router;
