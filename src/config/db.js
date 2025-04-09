import mongoose from "mongoose";

// Kết nối MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection failed", err);
    process.exit(1); // Dừng server nếu không kết nối được DB
  }
};

export default connectDB;
