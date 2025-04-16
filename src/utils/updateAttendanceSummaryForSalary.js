import Salary from "../models/salary.model.js";

// Hàm tính thuế thu nhập cá nhân
const calculateTax = (totalSalaryGross) => {
  let tax = 0;

  if (totalSalaryGross <= 10000000) {
    tax = 0; // Thuế 0% đối với thu nhập <= 10 triệu
  } else if (totalSalaryGross <= 20000000) {
    tax = (totalSalaryGross - 10000000) * 0.1; // Thuế 10% đối với thu nhập từ 10 triệu đến 20 triệu
  } else if (totalSalaryGross <= 30000000) {
    tax = (totalSalaryGross - 20000000) * 0.15 + 1000000; // Thuế 15% đối với thu nhập từ 20 triệu đến 30 triệu
  } else {
    tax = (totalSalaryGross - 30000000) * 0.2 + 2500000; // Thuế 20% đối với thu nhập trên 30 triệu
  }

  return tax;
};

const updateAttendanceSummaryForSalary = async (employeeId, month, year, summary) => {
  try {
    // Cập nhật bảng chấm công vào bảng lương
    const updatedSalary = await Salary.findOneAndUpdate(
      { employeeId },
      {
        attendanceMonth: month,
        attendanceYear: year,
        attendanceSummary: summary,
      },
      { new: true },
    );

    if (updatedSalary) {
      // Lấy thông tin lương cơ bản và các khoản phụ cấp từ bảng lương
      const {
        basicSalary,
        responsibilityAllowance,
        transportAllowance,
        phoneAllowance,
        lunchAllowance,
        childrenAllowance,
        attendanceAllowance,
        seniorityAllowance,
      } = updatedSalary;

      // Tính lương cơ bản theo công thức mới (lương cơ bản / 24 * số ngày công thực tế)
      const baseSalary = Math.round((basicSalary / 24) * summary.workingDays); // Làm tròn lương cơ bản

      // Tính tổng lương gross
      const totalSalaryGross = Math.round(
        baseSalary +
          responsibilityAllowance +
          transportAllowance +
          phoneAllowance +
          lunchAllowance +
          childrenAllowance +
          attendanceAllowance +
          seniorityAllowance,
      ); // Làm tròn tổng lương gross

      // Tính thuế thu nhập cá nhân
      const personalIncomeTax = Math.round(calculateTax(totalSalaryGross)); // Làm tròn thuế thu nhập cá nhân

      // Tính lương net (lương gross - thuế)
      const totalSalaryNet = Math.round(totalSalaryGross - personalIncomeTax - updatedSalary.employeeInsurance); // Làm tròn lương net

      // Cập nhật bảng lương với thông tin mới
      await Salary.findOneAndUpdate(
        { employeeId },
        {
          totalSalaryGross,
          totalSalaryNet,
          personalIncomeTax,
          effectiveDate: new Date(), // Cập nhật thời gian hiệu lực
        },
        { new: true },
      );

      console.log(`Lương của nhân viên ${employeeId} đã được tính và cập nhật thành công.`);
    }
  } catch (error) {
    console.error(`Lỗi khi cập nhật workingDays và tính lương cho ${employeeId}:`, error.message);
  }
};

export default updateAttendanceSummaryForSalary;
