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
      default: "DINA - CÔNG TY CỔ PHẦN DỊCH VỤ VÀ CÔNG NGHỆ DINA",
    },
    department: {
      type: String,
      required: true,
      enum: ["Ban Tổng giám đốc", "Ban Kỹ thuật", "Ban nhân sự", "Ban bán hàng", "Ban truyền thông"],
    },
    position: {
      type: String,
      required: true,
      enum: ["Thực tập sinh", "Thử việc", "Nhân viên", "Trưởng phòng", "Phó giám đốc", "Tổng giám đốc"],
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
  },
  {
    timestamps: true,
  },
);

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
