import Salary from "../models/salary.model.js";

// Hàm tính thuế thu nhập cá nhân theo biểu thuế lũy tiến mới (không giảm trừ)
const calculateTax = (taxableIncome) => {
  if (taxableIncome <= 0) return 0;

  let tax = 0;
  const brackets = [
    { limit: 5000000, rate: 0.05 },
    { limit: 10000000, rate: 0.1 },
    { limit: 18000000, rate: 0.15 },
    { limit: 32000000, rate: 0.2 },
    { limit: 52000000, rate: 0.25 },
    { limit: 80000000, rate: 0.3 },
    { limit: Infinity, rate: 0.35 },
  ];

  let previousLimit = 0;

  for (const { limit, rate } of brackets) {
    if (taxableIncome > previousLimit) {
      const amount = Math.min(taxableIncome, limit) - previousLimit;
      tax += amount * rate;
      previousLimit = limit;
    } else {
      break;
    }
  }

  return Math.round(tax);
};

const updateAttendanceSummaryForSalary = async (employeeId, month, year, summary) => {
  try {
    const existingSalary = await Salary.findOne({ employeeId });

    const baseSalaryInfo =
      existingSalary || (await Salary.findOne({ employeeId }, {}, { sort: { effectiveDate: -1 } }));

    if (!baseSalaryInfo) {
      console.error(`Không tìm thấy thông tin lương cơ bản cho nhân viên ${employeeId}`);
      return;
    }

    const {
      basicSalary,
      responsibilityAllowance,
      transportAllowance,
      phoneAllowance,
      lunchAllowance,
      childrenAllowance,
      attendanceAllowance,
      seniorityAllowance,
    } = baseSalaryInfo;

    const totalSalaryGross = Math.round(
      basicSalary +
        responsibilityAllowance +
        transportAllowance +
        phoneAllowance +
        lunchAllowance +
        childrenAllowance +
        attendanceAllowance +
        seniorityAllowance,
    );

    const baseSalary = Math.round((totalSalaryGross / 22) * summary.workingDays);

    const employeeInsurance = Math.round(baseSalary * 0.105);

    const taxableIncome = baseSalary - employeeInsurance;

    const personalIncomeTax = calculateTax(taxableIncome);

    const totalSalaryNet = Math.round(taxableIncome - personalIncomeTax);

    if (
      existingSalary &&
      (existingSalary.attendanceMonth === null ||
        existingSalary.attendanceYear === null ||
        (existingSalary.attendanceMonth === month && existingSalary.attendanceYear === year))
    ) {
      await Salary.findOneAndUpdate(
        { employeeId },
        {
          attendanceMonth: month,
          attendanceYear: year,
          attendanceSummary: summary,
          totalSalaryGross,
          totalSalaryNet,
          personalIncomeTax,
          employeeInsurance,
          effectiveDate: new Date(),
        },
        { new: true },
      );

      console.log(`Lương của nhân viên ${employeeId} đã được cập nhật thành công.`);
    } else {
      await Salary.create({
        employeeId,
        attendanceMonth: month,
        attendanceYear: year,
        attendanceSummary: summary,
        basicSalary,
        responsibilityAllowance,
        transportAllowance,
        phoneAllowance,
        lunchAllowance,
        childrenAllowance,
        attendanceAllowance,
        seniorityAllowance,
        employeeInsurance,
        totalSalaryGross,
        totalSalaryNet,
        personalIncomeTax,
        effectiveDate: new Date(),
      });

      console.log(`Đã tạo bản ghi lương mới cho nhân viên ${employeeId} tháng ${month}/${year}`);
    }
  } catch (error) {
    console.error(`Lỗi khi cập nhật workingDays và tính lương cho ${employeeId}:`, error.message);
  }
};

export default updateAttendanceSummaryForSalary;
