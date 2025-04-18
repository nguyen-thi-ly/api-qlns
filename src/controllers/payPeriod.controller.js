import payPeriodModel from "../models/payPeriod.model.js";
import Salary from "../models/salary.model.js";
import Employee from "../models/employee.model.js";

export const createPayPeriod = async (req, res) => {
  const { month, year, employeeIds } = req.body;

  try {
    const namePayPeriod = `Kỳ trả lương ${month}/${year}-TSC-HO`;

    // Tìm kỳ lương đã tồn tại
    const existingPayPeriod = await payPeriodModel.findOne({ namePayPeriod });

    let payPeriod;

    if (existingPayPeriod) {
      // Nếu đã có, cập nhật danh sách employeeIds (gộp & loại trùng)
      const mergedEmployeeIds = Array.from(new Set([...existingPayPeriod.employeeIds, ...employeeIds]));

      existingPayPeriod.employeeIds = mergedEmployeeIds;
      payPeriod = await existingPayPeriod.save();
    } else {
      // Nếu chưa có, tạo mới
      payPeriod = await payPeriodModel.create({
        namePayPeriod,
        employeeIds,
        month,
        year,
      });
    }

    res.status(201).json({
      success: true,
      message: "Tạo hoặc cập nhật kỳ lương thành công",
      data: payPeriod,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Tạo hoặc cập nhật kỳ lương thất bại",
      error: error.message,
    });
  }
};

export const getPayPeriod = async (req, res) => {
  try {
    const payPeriods = await payPeriodModel.find().lean();
    res.status(200).json({
      success: true,
      message: "Lấy danh sách kỳ lương thành công",
      data: payPeriods,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lấy danh sách kỳ lương thất bại",
      error: error.message,
    });
  }
};

export const getPayPeriodById = async (req, res) => {
  const { id } = req.params;
  try {
    const payPeriod = await payPeriodModel.findById(id).lean();
    if (!payPeriod) {
      return res.status(404).json({
        success: false,
        message: "Kỳ lương không tồn tại",
      });
    }

    const matched = payPeriod.namePayPeriod.match(/Kỳ trả lương (\d{1,2})\/(\d{4})/);
    const month = matched ? parseInt(matched[1]) : null;
    const year = matched ? parseInt(matched[2]) : null;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Không xác định được tháng/năm từ kỳ lương",
      });
    }

    // Lấy bảng lương của các nhân viên trong kỳ
    const salaries = await Salary.find({
      employeeId: { $in: payPeriod.employeeIds },
      attendanceMonth: month,
      attendanceYear: year,
    }).lean();

    // Lấy tên nhân viên tương ứng
    const employees = await Employee.find({
      employeeId: { $in: payPeriod.employeeIds },
    }).lean();

    // Map employeeId -> fullName
    const employeeMap = {};
    employees.forEach((emp) => {
      employeeMap[emp.employeeId] = emp.fullName;
    });

    // Gộp tên nhân viên vào mỗi mục trong danh sách salaries
    const salariesWithName = salaries.map((salary) => ({
      ...salary,
      fullName: employeeMap[salary.employeeId] || "Không tìm thấy tên",
    }));

    res.status(200).json({
      success: true,
      message: "Lấy thông tin kỳ lương thành công",
      data: {
        payPeriod,
        salaries: salariesWithName,
        fromDate: `26/${month - 1}`,
        toDate: `25/${month}`,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lấy thông tin kỳ lương thất bại",
      error: error.message,
    });
  }
};
