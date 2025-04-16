import Salary from "../models/salary.model.js";
import Employee from "../models/employee.model.js";

const getSalaries = async (req, res) => {
  try {
    const salaries = await Salary.find({});
    res.json(salaries);

    // Tạo mảng kết quả với thông tin chi tiết nhân viên
    // const result = await Promise.all(
    //   salaries.map(async (salary) => {
    //     const employee = await Employee.findOne({ employeeId: salary.employeeId });

    //     return {
    //       _id: salary._id,
    //       // Thông tin nhân viên
    //       employeeId: salary.employeeId,
    //       fullName: employee ? employee.fullName : "Không tìm thấy",
    //       department: employee ? employee.department : "Không tìm thấy",

    //       // Thông tin bảng lương
    //       basicSalary: salary.basicSalary,
    //       responsibilityAllowance: salary.responsibilityAllowance,
    //       transportAllowance: salary.transportAllowance,
    //       phoneAllowance: salary.phoneAllowance,
    //       lunchAllowance: salary.lunchAllowance,
    //       childrenAllowance: salary.childrenAllowance,
    //       attendanceAllowance: salary.attendanceAllowance,
    //       seniorityAllowance: salary.seniorityAllowance,
    //       effectiveDate: salary.effectiveDate,
    //       month: salary.attendanceMonth,
    //       year: salary.attendanceYear,
    //       detail: salary.attendanceSummary,
    //       createdAt: salary.createdAt,
    //       updatedAt: salary.updatedAt,
    //     };
    //   }),
    // );

    // res.json(result);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const getSalaryByEmployeeId = async (req, res) => {
  try {
    const salary = await Salary.findOne({ employeeId: req.params.employeeId });

    if (salary) {
      const employee = await Employee.findOne({ employeeId: salary.employeeId });
      const result = {
        _id: salary._id,
        // Thông tin nhân viên
        employeeId: salary.employeeId,
        fullName: employee ? employee.fullName : "Không tìm thấy",
        department: employee ? employee.department : "Không tìm thấy",

        // Thông tin bảng lương
        basicSalary: salary.basicSalary,
        responsibilityAllowance: salary.responsibilityAllowance,
        transportAllowance: salary.transportAllowance,
        phoneAllowance: salary.phoneAllowance,
        lunchAllowance: salary.lunchAllowance,
        childrenAllowance: salary.childrenAllowance,
        attendanceAllowance: salary.attendanceAllowance,
        seniorityAllowance: salary.seniorityAllowance,
        effectiveDate: salary.effectiveDate,
        createdAt: salary.createdAt,
        updatedAt: salary.updatedAt,
      };

      res.json(result);
    } else {
      res.status(404).json({ message: "Không tìm thấy bảng lương cho nhân viên này" });
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const createOrUpdateSalary = async (req, res) => {
  try {
    const {
      employeeId,
      basicSalary,
      responsibilityAllowance,
      transportAllowance,
      phoneAllowance,
      lunchAllowance,
      childrenAllowance,
      attendanceAllowance,
      seniorityAllowance,
      effectiveDate,
    } = req.body;

    const employee = await Employee.findOne({ employeeId });

    if (!employee) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    // Kiểm tra xem bảng lương đã tồn tại chưa
    let salary = await Salary.findOne({ employeeId });

    if (salary) {
      // Cập nhật bảng lương hiện có
      salary.basicSalary = basicSalary || salary.basicSalary;
      salary.responsibilityAllowance =
        responsibilityAllowance !== undefined ? responsibilityAllowance : salary.responsibilityAllowance;
      salary.transportAllowance = transportAllowance !== undefined ? transportAllowance : salary.transportAllowance;
      salary.phoneAllowance = phoneAllowance !== undefined ? phoneAllowance : salary.phoneAllowance;
      salary.lunchAllowance = lunchAllowance !== undefined ? lunchAllowance : salary.lunchAllowance;
      salary.childrenAllowance = childrenAllowance !== undefined ? childrenAllowance : salary.childrenAllowance;
      salary.attendanceAllowance = attendanceAllowance !== undefined ? attendanceAllowance : salary.attendanceAllowance;
      salary.seniorityAllowance = seniorityAllowance !== undefined ? seniorityAllowance : salary.seniorityAllowance;
      salary.effectiveDate = effectiveDate || salary.effectiveDate;

      const updatedSalary = await salary.save();
      res.json(updatedSalary);
    } else {
      // Tạo bảng lương mới
      salary = await Salary.create({
        employeeId,
        basicSalary,
        responsibilityAllowance: responsibilityAllowance || 0,
        transportAllowance: transportAllowance || 0,
        phoneAllowance: phoneAllowance || 0,
        lunchAllowance: lunchAllowance || 0,
        childrenAllowance: childrenAllowance || 0,
        attendanceAllowance: attendanceAllowance || 0,
        seniorityAllowance: seniorityAllowance || 0,
        effectiveDate: effectiveDate || Date.now(),
      });

      if (salary) {
        res.status(201).json(salary);
      } else {
        res.status(400).json({ message: "Dữ liệu bảng lương không hợp lệ" });
      }
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({ message: "Lỗi server" });
  }
};

const deleteSalary = async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);

    if (salary) {
      await Salary.deleteOne({ _id: req.params.id });
      res.json({ message: "Đã xóa bảng lương" });
    } else {
      res.status(404).json({ message: "Không tìm thấy bảng lương" });
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export { getSalaries, getSalaryByEmployeeId, createOrUpdateSalary, deleteSalary };
