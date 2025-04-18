import Employee from "../models/employee.model.js";
import Salary from "../models/salary.model.js";
import generateEmployeeId from "../utils/generateEmployeeCode.js";
import Attendance from "../models/attendance.model.js";
import Contract from "../models/contract.model.js";
import Insurance from "../models/insurance.model.js";
import generateContractId from "../utils/generateContractId.js";
// @desc    Get all employees
// @route   GET /api/employees
// @access  Public
const getEmployees = async (req, res) => {
  try {
    const { month, year } = req.query;

    // Lấy danh sách nhân viên
    const employees = await Employee.find({});

    // Xử lý từng nhân viên
    const result = await Promise.all(
      employees.map(async (employee) => {
        let attendance = null;

        // Lấy chấm công nếu có lọc theo tháng/năm
        if (month && year) {
          attendance = await Attendance.findOne({
            employeeId: employee.employeeId,
            month: parseInt(month),
            year: parseInt(year),
          });

          if (attendance) {
            const totalWorkingDays = attendance.attendanceData.length;
            const totalActualDays = attendance.attendanceData.reduce((sum, day) => sum + day.value, 0);

            attendance = {
              ...attendance.toObject(),
              totalWorkingDays,
              totalActualDays,
            };
          }
        }

        // 🔗 Lấy hợp đồng theo employeeId
        const contracts = await Contract.find({ employeeId: employee.employeeId });

        // 🔗 Lấy bảo hiểm theo employeeId
        const insurance = await Insurance.findOne({ employeeId: employee.employeeId });

        return {
          ...employee.toObject(),
          contracts: contracts.map((contract) => ({
            contractId: contract.contractId,
            contractType: contract.contractType,
            fromDate: contract.fromDate,
            toDate: contract.toDate,
          })),
          insurance: insurance ? insurance.toObject() : null,
          attendance,
        };
      }),
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Lỗi getEmployees:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách nhân viên",
    });
  }
};

// @desc    Get employee by ID
// @route   GET /api/employees/:id
// @access  Public
const getEmployeeById = async (req, res) => {
  try {
    // Tìm nhân viên theo mã
    const employee = await Employee.findOne({ employeeId: req.params.id });

    if (!employee) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    // Lấy hợp đồng liên quan (có thể là mảng rỗng)
    const contracts = await Contract.find({ employeeId: employee.employeeId });

    // Lấy bảo hiểm liên quan (có thể null)
    const insurance = await Insurance.findOne({ employeeId: employee.employeeId });

    const salary = await Salary.findOne({ employeeId: employee.employeeId });

    const defaultSalary = {
      basicSalary: 0,
      responsibilityAllowance: 0,
      transportAllowance: 0,
      phoneAllowance: 0,
      lunchAllowance: 0,
      childrenAllowance: 0,
      attendanceAllowance: 0,
      seniorityAllowance: 0,
      totalSalaryGross: 0,
    };

    const defaultInsurance = {
      salaryForInsurance: 0,
      companyInsurance: {
        rate: {
          socialInsurance: 0,
          healthInsurance: 0,
          unemploymentInsurance: 0,
        },
      },
      employeeInsurance: {
        rate: {
          socialInsurance: 0,
          healthInsurance: 0,
          unemploymentInsurance: 0,
        },
      },
    };

    res.status(200).json({
      employee: employee.toObject(),
      contracts: contracts.map((c) => ({
        contractId: c.contractId,
        contractType: c.contractType,
        fromDate: c.fromDate,
        toDate: c.toDate,
      })),
      salary: salary ? salary : defaultSalary,
      insurance: insurance ? insurance.toObject() : defaultInsurance,
    });
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

    if (!employee) {
      return res.status(400).json({ message: "Dữ liệu nhân viên không hợp lệ" });
    }

    res.status(201).json({
      employee,
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);

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
    const { fullName, birthDate, email, phone, department, position, personalInfo, contract, insurance, salary } =
      req.body;

    const employee = await Employee.findOne({ employeeId: req.params.id });

    if (!employee) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    // Cập nhật thông tin nhân viên
    employee.fullName = fullName || employee.fullName;
    employee.birthDate = birthDate || employee.birthDate;
    employee.email = email || employee.email;
    employee.phone = phone || employee.phone;
    employee.department = department || employee.department;
    employee.position = position || employee.position;

    if (personalInfo) {
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
      employee.personalInfo.permanentAddress = personalInfo.permanentAddress || employee.personalInfo.permanentAddress;
      employee.personalInfo.temporaryAddress =
        personalInfo.temporaryAddress !== undefined
          ? personalInfo.temporaryAddress
          : employee.personalInfo.temporaryAddress;
    }

    const updatedEmployee = await employee.save();

    // Cập nhật hoặc thêm mới hợp đồng (nếu có)
    let updatedContracts = [];
    if (Array.isArray(contract)) {
      // Lấy tất cả hợp đồng hiện tại của nhân viên
      const existingContracts = await Contract.find({ employeeId: employee.employeeId });

      // Tạo map của hợp đồng hiện tại để dễ tìm kiếm
      const existingContractsMap = {};
      existingContracts.forEach((contract) => {
        existingContractsMap[contract.contractId] = contract;
      });

      // Danh sách contractIds cần giữ lại
      const contractIdsToKeep = contract.map((item) => item.contractId).filter((id) => id);

      // Xóa những hợp đồng không có trong danh sách mới
      await Contract.deleteMany({
        employeeId: employee.employeeId,
        contractId: { $nin: contractIdsToKeep },
      });

      // Cập nhật hoặc thêm mới hợp đồng
      updatedContracts = await Promise.all(
        contract.map(async (item) => {
          if (item.contractId && existingContractsMap[item.contractId]) {
            // Cập nhật hợp đồng hiện có
            return await Contract.findOneAndUpdate(
              { contractId: item.contractId },
              {
                contractType: item.contractType,
                fromDate: item.fromDate,
                toDate: item.toDate,
              },
              { new: true },
            );
          } else {
            // Tạo hợp đồng mới với ID mới
            // Tìm số lớn nhất hiện tại để tạo ID mới
            const allContracts = await Contract.find({
              employeeId: employee.employeeId,
              contractId: { $regex: /^HD-DEHA-\d+$/ },
            });

            const maxIdNumber = allContracts.reduce((max, contract) => {
              const idNumber = parseInt(contract.contractId.split("-")[2]);
              return idNumber > max ? idNumber : max;
            }, 0);

            const newContractId = `HD-DEHA-${maxIdNumber + 1}`;

            // Thêm mới hợp đồng
            return await Contract.create({
              employeeId: employee.employeeId,
              contractId: newContractId,
              contractType: item.contractType,
              fromDate: item.fromDate,
              toDate: item.toDate,
            });
          }
        }),
      );
    }

    // Cập nhật bảo hiểm (nếu có)
    let updatedInsurance = null;
    if (insurance) {
      const salary = insurance.salaryForInsurance || 0;
      const companyRates = insurance.companyInsurance?.rate || {};
      const employeeRates = insurance.employeeInsurance?.rate || {};

      const totalCompanyInsurance =
        (salary *
          ((companyRates.socialInsurance || 0) +
            (companyRates.healthInsurance || 0) +
            (companyRates.unemploymentInsurance || 0))) /
        100;

      const totalEmployeeInsurance =
        (salary *
          ((employeeRates.socialInsurance || 0) +
            (employeeRates.healthInsurance || 0) +
            (employeeRates.unemploymentInsurance || 0))) /
        100;

      // Tìm bản ghi bảo hiểm cũ
      updatedInsurance = await Insurance.findOneAndUpdate(
        { employeeId: employee.employeeId },
        {
          salaryForInsurance: salary,
          companyInsurance: { rate: companyRates },
          employeeInsurance: { rate: employeeRates },
          totalCompanyInsurance,
          totalEmployeeInsurance,
        },
        { new: true, upsert: true }, // tạo mới nếu chưa có
      );
    }

    let updatedSalary = null;
    if (salary && salary.basicSalary) {
      const totalSalaryGross =
        (salary.basicSalary || 0) +
        (salary.responsibilityAllowance || 0) +
        (salary.transportAllowance || 0) +
        (salary.phoneAllowance || 0) +
        (salary.lunchAllowance || 0) +
        (salary.childrenAllowance || 0) +
        (salary.attendanceAllowance || 0) +
        (salary.seniorityAllowance || 0);

      updatedSalary = await Salary.findOneAndUpdate(
        { employeeId: employee.employeeId },
        {
          ...salary,
          totalSalaryGross,
          employeeInsurance: updatedInsurance ? updatedInsurance.employeeInsurance.value.total : 0,
          effectiveDate: new Date(),
        },
        { new: true, upsert: true },
      );
    }

    res.json({
      employee: updatedEmployee,
      contracts: updatedContracts,
      insurance: updatedInsurance,
      salary: updatedSalary,
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);

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
      await Attendance.deleteMany({ employeeId: employee.employeeId });
      await Employee.deleteOne({ employeeId: req.params.id });
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
