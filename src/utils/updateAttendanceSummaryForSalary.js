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

    // Phụ cấp không tính thuế: tổng các phụ cấp không tính thuế: phụ cấp đi lại + phụ cấp điện thoại + phụ cấp ăn trưa + phụ cấp con nhỏ + phụ cấp thâm niên
    const nonTaxableaAllowance =
      transportAllowance + phoneAllowance + lunchAllowance + childrenAllowance + seniorityAllowance;

    // Phụ cấp tính thuế: phụ cấp chuyên cần + phuhc cấp trách nhiệm
    const taxableAllowance = responsibilityAllowance + attendanceAllowance;

    // Tiền tăng ca: Số giờ tăng ca * (Lương giờ * hệ số tăng ca)
    // Lương 1 giờ
    const hourlyWage = basicSalary / (22 * 8);

    // Tổng tiền tăng ca: Số giờ tăng ca * (Lương giờ * hệ số tăng ca)
    const totalOT = Math.round(summary.otHours * (hourlyWage * 1.5));

    // Tổng lương thực tế: (lương cơ bản + phụ cấp tính thuế) / 22 * số ngày công
    const grossActualWage = Math.round(((basicSalary + taxableAllowance) / summary.totalDays) * summary.workingDays);

    // Bảo hiểm nhân viên: (lương cơ bản + phụ cấp tính thuế) * 10.5%
    const employeeInsurance = (basicSalary + taxableAllowance) * 0.105;

    // Tổng thu nhập chịu thuế: Lương cơ bản + phụ cấp tính thuế
    const totalTaxableIncome = basicSalary + totalOT + taxableAllowance;

    // Tổng thu nhập chịu thuế thực tế: Tổng lương thực tế - Bảo hiểm nhân viên
    const taxableIncome = totalTaxableIncome - employeeInsurance;

    // Tính thuế thu nhập cá nhân
    const personalIncomeTax = calculateTax(taxableIncome);

    // Lương thực nhận:
    const totalSalaryNet = totalTaxableIncome - employeeInsurance - personalIncomeTax + nonTaxableaAllowance;

    if (
      existingSalary &&
      (existingSalary.attendanceMonth == month || existingSalary.attendanceMonth == null) &&
      (existingSalary.attendanceYear == year || existingSalary.attendanceYear == null)
    ) {
      await Salary.findOneAndUpdate(
        { employeeId },
        {
          attendanceMonth: month,
          attendanceYear: year,
          attendanceSummary: summary,
          totalSalaryGross: grossActualWage,
          totalSalaryNet,
          personalIncomeTax,
          employeeInsurance,
          overTimePay: totalOT,
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
        totalSalaryGross: grossActualWage,
        overTimePay: totalOT,
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
