import Employee from "../models/employee.model.js";
import Salary from "../models/salary.model.js";
import generateEmployeeId from "../utils/generateEmployeeCode.js";

// @desc    Get all employees
// @route   GET /api/employees
// @access  Public
const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({});
    res.json(employees);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// @desc    Get employee by ID
// @route   GET /api/employees/:id
// @access  Public
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (employee) {
      res.json(employee);
    } else {
      res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// @desc    Create new employee
// @route   POST /api/employees
// @access  Public
const createEmployee = async (req, res) => {
  try {
    const { fullName, birthDate, email, phone, department, position, personalInfo } = req.body;

    // Tạo mã nhân viên tự động
    const employeeId = await generateEmployeeId();

    const employee = await Employee.create({
      employeeId,
      fullName,
      birthDate,
      email,
      phone,
      department,
      position,
      personalInfo,
    });

    if (employee) {
      res.status(201).json(employee);
    } else {
      res.status(400).json({ message: "Dữ liệu nhân viên không hợp lệ" });
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);

    // Xử lý lỗi trùng email
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(400).json({ message: "Email này đã được sử dụng" });
    }

    res.status(500).json({ message: "Lỗi server" });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Public
const updateEmployee = async (req, res) => {
  try {
    const { fullName, birthDate, email, phone, department, position, personalInfo } = req.body;

    const employee = await Employee.findById(req.params.id);

    if (employee) {
      employee.fullName = fullName || employee.fullName;
      employee.birthDate = birthDate || employee.birthDate;
      employee.email = email || employee.email;
      employee.phone = phone || employee.phone;
      employee.department = department || employee.department;
      employee.position = position || employee.position;

      if (personalInfo) {
        // Cập nhật từng trường trong personalInfo nếu được cung cấp
        if (personalInfo.idCard) {
          employee.personalInfo.idCard = {
            ...employee.personalInfo.idCard,
            ...personalInfo.idCard,
          };
        }

        if (personalInfo.bankAccount) {
          employee.personalInfo.bankAccount = {
            ...employee.personalInfo.bankAccount,
            ...personalInfo.bankAccount,
          };
        }

        employee.personalInfo.taxCode = personalInfo.taxCode || employee.personalInfo.taxCode;
        employee.personalInfo.permanentAddress =
          personalInfo.permanentAddress || employee.personalInfo.permanentAddress;
        employee.personalInfo.temporaryAddress =
          personalInfo.temporaryAddress !== undefined
            ? personalInfo.temporaryAddress
            : employee.personalInfo.temporaryAddress;
      }

      const updatedEmployee = await employee.save();
      res.json(updatedEmployee);
    } else {
      res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);

    // Xử lý lỗi trùng email
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(400).json({ message: "Email này đã được sử dụng" });
    }

    res.status(500).json({ message: "Lỗi server" });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Public
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (employee) {
      // Xóa cả bảng lương khi xóa nhân viên
      await Salary.deleteMany({ employeeId: employee.employeeId });
      await Employee.deleteOne({ _id: req.params.id });
      res.json({ message: "Đã xóa nhân viên" });
    } else {
      res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export { getEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee };
