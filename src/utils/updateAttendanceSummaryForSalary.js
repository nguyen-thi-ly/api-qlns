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
    // Tìm kiếm bản ghi lương hiện tại của nhân viên
    const existingSalary = await Salary.findOne({ employeeId });

    // Kiểm tra nếu đã có bản ghi và attendanceMonth, attendanceYear là null
    // hoặc khớp với month, year truyền vào
    if (
      existingSalary &&
      (existingSalary.attendanceMonth === null ||
        existingSalary.attendanceYear === null ||
        (existingSalary.attendanceMonth === month && existingSalary.attendanceYear === year))
    ) {
      // Cập nhật bản ghi hiện tại
      const updatedSalary = await Salary.findOneAndUpdate(
        { employeeId },
        {
          attendanceMonth: month,
          attendanceYear: year,
          attendanceSummary: summary,
        },
        { new: true },
      );

      // Tiến hành tính toán lương dựa trên bản ghi này
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
        const baseSalary = Math.round((basicSalary / 24) * summary.workingDays);

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
        );

        // Tính thuế thu nhập cá nhân
        const personalIncomeTax = Math.round(calculateTax(totalSalaryGross));

        // Tính lương net (lương gross - thuế)
        const totalSalaryNet = Math.round(totalSalaryGross - personalIncomeTax - updatedSalary.employeeInsurance);

        // Cập nhật bảng lương với thông tin mới
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
      // Nếu không có bản ghi hoặc attendanceMonth, attendanceYear khác với month, year truyền vào
      // thì tạo bản ghi mới

      // Lấy thông tin lương cơ bản mới nhất của nhân viên
      const baseSalaryInfo =
        existingSalary || (await Salary.findOne({ employeeId }, {}, { sort: { effectiveDate: -1 } }));

      if (!baseSalaryInfo) {
        console.error(`Không tìm thấy thông tin lương cơ bản cho nhân viên ${employeeId}`);
        return;
      }

      // Sao chép thông tin lương cơ bản
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

      // Tính lương cơ bản theo công thức mới
      const baseSalary = Math.round((basicSalary / 24) * summary.workingDays);

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
      );

      // Tính thuế thu nhập cá nhân
      const personalIncomeTax = Math.round(calculateTax(totalSalaryGross));

      // Tính lương net
      const totalSalaryNet = Math.round(totalSalaryGross - personalIncomeTax - employeeInsurance);

      // Tạo bản ghi lương mới với tháng và năm mới
      const newSalary = await Salary.create({
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
