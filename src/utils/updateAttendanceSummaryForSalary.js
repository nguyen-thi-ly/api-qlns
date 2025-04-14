import Salary from "../models/salary.model.js";

const updateAttendanceSummaryForSalary = async (employeeId, month, year, summary) => {
  try {
    await Salary.findOneAndUpdate(
      { employeeId },
      {
        attendanceMonth: month,
        attendanceYear: year,
        attendanceSummary: summary,
      },
      { new: true },
    );
  } catch (error) {
    console.error(`Lỗi khi cập nhật workingDays vào bảng lương cho ${employeeId}:`, error.message);
  }
};

export default updateAttendanceSummaryForSalary;
