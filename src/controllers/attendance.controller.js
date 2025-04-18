import xlsx from "xlsx";
import Attendance from "../models/attendance.model.js";
import Employee from "../models/employee.model.js";
import updateAttendanceSummaryForSalary from "../utils/updateAttendanceSummaryForSalary.js";

const importAttendance = async (req, res) => {
  try {
    const { month, year } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: "Vui lòng tải lên file Excel" });
    }

    // Đọc file Excel
    const workbook = xlsx.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    // Lấy các dòng tiêu đề
    const dates = jsonData[1].slice(2); // Dòng ngày (bỏ qua 2 cột đầu)
    const dayOfWeeks = jsonData[2].slice(2); // Dòng thứ

    let importedCount = 0;
    const errorList = [];

    for (let i = 3; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;

      const employeeId = row[0];
      const fullName = row[1];

      // Kiểm tra nhân viên tồn tại
      const employee = await Employee.findOne({ employeeId });
      if (!employee) {
        errorList.push({
          row: i + 1,
          employeeId,
          message: "Nhân viên không tồn tại trong hệ thống",
        });
        continue;
      }

      // Xử lý dữ liệu chấm công
      const attendanceData = [];
      let fullDays = 0;
      let halfDays = 0;
      let offDays = 0;

      for (let j = 2; j < row.length; j++) {
        if (!dates[j - 2] || !dayOfWeeks[j - 2]) continue;

        let value = row[j];
        // Xử lý giá trị công
        if (value === "" || value === null || value === undefined) {
          value = 0;
        } else if (typeof value === "string") {
          value = parseFloat(value.replace(",", ".")) || 0;
        }

        // Validate giá trị
        if (![0, 0.5, 1].includes(value)) {
          value = 0;
        }

        const dayOfWeek = dayOfWeeks[j - 2];
        const isWeekend = dayOfWeek === "T7" || dayOfWeek === "CN";

        // Cập nhật thống kê
        if (value === 1) fullDays++;
        else if (value === 0.5) halfDays++;
        else if (value === 0 && !isWeekend) offDays++; // Chỉ tính ngày nghỉ nếu không phải cuối tuần

        // Xác định ngày thực tế
        const day = parseInt(dates[j - 2]);
        let actualMonth, actualYear;

        // Nếu ngày từ 26-31, thuộc tháng trước
        if (day >= 26) {
          actualMonth = month === 1 ? 12 : month - 1;
          actualYear = month === 1 ? year - 1 : year;
        } else {
          // Ngày 1-25 thuộc tháng hiện tại
          actualMonth = month;
          actualYear = year;
        }

        let status = "Nghỉ";
        if (value === 1) status = "Làm đủ";
        else if (value === 0.5) status = "Làm nửa ngày";

        attendanceData.push({
          date: `${actualYear}-${String(actualMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
          dayOfWeek: dayOfWeeks[j - 2],
          value,
          status,
        });
      }

      const totalDays = attendanceData.length;
      const workingDays = fullDays + halfDays;

      // Tạo summary
      const summary = {
        totalDays,
        fullDays,
        halfDays,
        offDays,
        workingDays,
      };

      // Lưu vào database
      try {
        await Attendance.findOneAndUpdate(
          { employeeId, month, year },
          {
            employee: {
              employeeId,
              fullName,
              department: employee.department,
              position: employee.position,
            },
            month,
            year,
            summary,
            attendanceData,
          },
          { upsert: true, new: true },
        );
        importedCount++;

        await updateAttendanceSummaryForSalary(employeeId, month, year, summary);
      } catch (error) {
        errorList.push({
          row: i + 1,
          employeeId,
          message: "Lỗi khi lưu dữ liệu",
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Import thành công ${importedCount} nhân viên`,
      data: {
        importedCount,
        errorList,
      },
    });
  } catch (error) {
    console.error("Lỗi khi import dữ liệu:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi import dữ liệu",
    });
  }
};

const getAttendance = async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Thiếu tháng hoặc năm",
      });
    }

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu mã nhân viên",
      });
    }

    let query = {};
    if (month && year) {
      query.month = parseInt(month);
      query.year = parseInt(year);
    }
    if (employeeId) {
      query.employeeId = employeeId;
    }

    // Lấy tất cả chấm công theo điều kiện
    const attendances = await Attendance.find(query).lean();

    // Lấy toàn bộ thông tin nhân viên để join
    const employees = await Employee.find({}).lean();
    const employeeMap = {};
    employees.forEach((emp) => {
      employeeMap[emp.employeeId] = emp;
    });

    // Format dữ liệu trả về
    const result = attendances.map((attendance) => {
      const emp = employeeMap[attendance.employeeId] || {};

      const summary = attendance.attendanceData.reduce(
        (acc, day) => {
          // Chỉ tính các ngày làm việc trong tuần (không phải T7 và CN)
          const isWeekend = day.dayOfWeek === "T7" || day.dayOfWeek === "CN";

          acc.totalDays++;

          if (day.value === 1) {
            acc.fullDays++;
          } else if (day.value === 0.5) {
            acc.halfDays++;
          } else {
            // Chỉ tính ngày nghỉ nếu không phải cuối tuần
            if (!isWeekend) {
              acc.offDays++;
            }
          }

          acc.workingDays += day.value;
          return acc;
        },
        { totalDays: 0, fullDays: 0, halfDays: 0, offDays: 0, workingDays: 0 },
      );

      return {
        employee: {
          employeeId: emp.employeeId,
          fullName: emp.fullName,
          department: emp.department,
          position: emp.position,
        },
        month: attendance.month,
        year: attendance.year,
        summary,
        attendanceData: attendance.attendanceData.map((day) => ({
          date: day.date,
          dayOfWeek: day.dayOfWeek,
          value: day.value,
          status: day.value === 1 ? "Làm đủ" : day.value === 0.5 ? "Nửa ngày" : "Nghỉ",
        })),
      };
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu chấm công:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy dữ liệu chấm công",
    });
  }
};

const getAllAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Thiếu tháng hoặc năm",
      });
    }

    // Lấy toàn bộ chấm công trong tháng/năm
    const attendances = await Attendance.find({ month: parseInt(month), year: parseInt(year) }).lean();

    // Lấy thông tin nhân viên để join
    const employees = await Employee.find({}).lean();
    const employeeMap = {};
    employees.forEach((emp) => {
      employeeMap[emp.employeeId] = emp;
    });

    const result = attendances.map((attendance) => {
      const emp = employeeMap[attendance.employeeId] || {};

      const summary = attendance.attendanceData.reduce(
        (acc, day) => {
          // Chỉ tính các ngày làm việc trong tuần (không phải T7 và CN)
          const isWeekend = day.dayOfWeek === "T7" || day.dayOfWeek === "CN";

          acc.totalDays++;

          if (day.value === 1) {
            acc.fullDays++;
          } else if (day.value === 0.5) {
            acc.halfDays++;
          } else {
            // Chỉ tính ngày nghỉ nếu không phải cuối tuần
            if (!isWeekend) {
              acc.offDays++;
            }
          }

          acc.workingDays += day.value;
          return acc;
        },
        { totalDays: 0, fullDays: 0, halfDays: 0, offDays: 0, workingDays: 0 },
      );

      return {
        employee: {
          employeeId: emp.employeeId,
          fullName: emp.fullName,
          department: emp.department,
          position: emp.position,
        },
        month: attendance.month,
        year: attendance.year,
        summary,
        attendanceData: attendance.attendanceData.map((day) => ({
          date: day.date,
          dayOfWeek: day.dayOfWeek,
          value: day.value,
          status: day.value === 1 ? "Làm đủ" : day.value === 0.5 ? "Nửa ngày" : "Nghỉ",
        })),
      };
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu chấm công:", error);
    res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi khi lấy dữ liệu chấm công",
    });
  }
};

export { importAttendance, getAttendance, getAllAttendance };
