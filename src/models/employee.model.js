import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: [true, "Vui lòng nhập tên nhân viên"],
    },
    birthDate: {
      type: Date,
      required: [true, "Vui lòng nhập ngày sinh"],
    },
    email: {
      type: String,
      required: [true, "Vui lòng nhập email"],
      unique: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Vui lòng nhập đúng định dạng email"],
    },
    phone: {
      type: String,
      required: [true, "Vui lòng nhập số điện thoại"],
    },
    company: {
      type: String,
      default: "DEHA - CÔNG TY CỔ PHẦN DỊCH VỤ VÀ CÔNG NGHỆ DEHA",
    },
    department: {
      type: String,
      required: true,
    },
    position: {
      type: String,
      required: true,
    },
    personalInfo: {
      idCard: {
        number: { type: String, required: true },
        issueDate: { type: Date, required: true },
        issuePlace: { type: String, required: true },
      },
      bankAccount: {
        accountNumber: { type: String, required: true },
        accountName: { type: String, required: true },
        bankName: { type: String, required: true },
      },
      taxCode: { type: String },
      permanentAddress: { type: String, required: true },
      temporaryAddress: { type: String },
    },
    attendances: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Attendance",
      },
    ],
  },
  {
    timestamps: true,
  },
);

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
