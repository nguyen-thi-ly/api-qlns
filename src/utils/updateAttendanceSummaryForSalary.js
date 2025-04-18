import Salary from "../models/salary.model.js";

// Hàm tính thuế thu nhập cá nhân theo biểu thuế lũy tiến từng phần
const calculateTax = (totalSalaryGross, employeeInsurance, dependents = 0) => {
  const personalDeduction = 11000000;
  const dependentDeduction = dependents * 4400000;
  const taxableIncome = totalSalaryGross - employeeInsurance - personalDeduction - dependentDeduction;

  if (taxableIncome <= 0) return 0;

  let tax = 0;
  if (taxableIncome <= 5000000) {
    tax = taxableIncome * 0.05;
  } else if (taxableIncome <= 10000000) {
    tax = (taxableIncome - 5000000) * 0.1 + 250000;
  } else if (taxableIncome <= 18000000) {
    tax = (taxableIncome - 10000000) * 0.15 + 750000;
  } else if (taxableIncome <= 32000000) {
    tax = (taxableIncome - 18000000) * 0.2 + 1950000;
  } else if (taxableIncome <= 52000000) {
    tax = (taxableIncome - 32000000) * 0.25 + 4750000;
  } else if (taxableIncome <= 80000000) {
    tax = (taxableIncome - 52000000) * 0.3 + 9750000;
  } else {
    tax = (taxableIncome - 80000000) * 0.35 + 18150000;
  }

  return Math.round(tax);
};

const updateAttendanceSummaryForSalary = async (employeeId, month, year, summary) => {
  try {
    const existingSalary = await Salary.findOne({ employeeId });

    if (
      existingSalary &&
      (existingSalary.attendanceMonth === null ||
        existingSalary.attendanceYear === null ||
        (existingSalary.attendanceMonth === month && existingSalary.attendanceYear === year))
    ) {
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
        const {
          basicSalary,
          responsibilityAllowance,
          transportAllowance,
          phoneAllowance,
          lunchAllowance,
          childrenAllowance,
          attendanceAllowance,
          seniorityAllowance,
          employeeInsurance,
        } = updatedSalary;

        const baseSalary = Math.round((basicSalary / 24) * summary.workingDays);

        const totalSalaryGross = Math.round(
          baseSalary +
            responsibilityAllowance +
            transportAllowance +
            phoneAllowance +
            lunchAllowance +
            childrenAllowance +
            attendanceAllowance +
            seniorityAllowance,
        );

        const personalIncomeTax = calculateTax(totalSalaryGross, employeeInsurance);

        const totalSalaryNet = Math.round(totalSalaryGross - personalIncomeTax - employeeInsurance);

        await Salary.findOneAndUpdate(
          { employeeId },
          {
            totalSalaryGross,
            totalSalaryNet,
            personalIncomeTax,
            effectiveDate: new Date(),
          },
          { new: true },
        );

        console.log(`Lương của nhân viên ${employeeId} đã được tính và cập nhật thành công.`);
      }
    } else {
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
        employeeInsurance,
      } = baseSalaryInfo;

      const baseSalary = Math.round((basicSalary / 24) * summary.workingDays);

      const totalSalaryGross = Math.round(
        baseSalary +
          responsibilityAllowance +
          transportAllowance +
          phoneAllowance +
          lunchAllowance +
          childrenAllowance +
          attendanceAllowance +
          seniorityAllowance,
      );

      const personalIncomeTax = calculateTax(totalSalaryGross, employeeInsurance);

      const totalSalaryNet = Math.round(totalSalaryGross - personalIncomeTax - employeeInsurance);

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
