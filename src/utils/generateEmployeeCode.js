import Employee from "../models/employee.model.js";

const generateEmployeeId = async () => {
  // Tìm nhân viên mới nhất có mã employeeId
  const latestEmployee = await Employee.findOne({ employeeId: { $exists: true } }).sort({ employeeId: -1 });

  let nextNumber = 1;

  if (latestEmployee && latestEmployee.employeeId) {
    const numericPart = parseInt(latestEmployee.employeeId.slice(4), 10);
    if (!isNaN(numericPart)) {
      nextNumber = numericPart + 1;
    }
  }

  return `DEHA${nextNumber.toString().padStart(5, "0")}`;
};

export default generateEmployeeId;
