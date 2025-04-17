import mongoose from "mongoose";

const payPeriod = new mongoose.Schema(
  {
    namePayPeriod: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      default: "DEHA - CÔNG TY CỔ PHẦN DỊCH VỤ VÀ CÔNG NGHỆ DEHA",
    },
    employeeIds: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true },
);

export default mongoose.model("payPeriod", payPeriod);
