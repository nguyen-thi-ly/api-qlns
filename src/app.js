import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js"; // Import cấu hình MongoDB
import authRoutes from "./routes/auth.route.js";
import employeeRoutes from "./routes/employee.route.js";
import salaryRoutes from "./routes/salary.route.js";
import verifyToken from "./middlewares/auth.middleware.js";
dotenv.config();
const app = express();

// Cấu hình CORS nếu cần thiết
app.use(cors());

// Parse body requests
app.use(express.json());

// Kết nối MongoDB
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", verifyToken, employeeRoutes);
app.use("/api/salaries", verifyToken, salaryRoutes);

app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});
