import mongoose from "mongoose";

const contractSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      ref: "Employee",
    },
    contractId: {
      type: String,
      required: true,
    },
    contractType: {
      type: String,
      required: true,
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Contract = mongoose.model("Contract", contractSchema);
export default Contract;
